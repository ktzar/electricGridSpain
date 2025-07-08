import fs from 'fs'
import { fileURLToPath } from 'url';

import path from 'path'
import { format, subDays, addDays } from 'date-fns'
import express from 'express'
import dotenv from 'dotenv'
dotenv.config()
import logger from './logger.js'
import { select } from './statements.js'
import { graphqlHTTP } from 'express-graphql'
import { buildSchema } from 'graphql'
import cron from 'node-cron'
import sqlite3 from 'sqlite3'
import {open} from 'sqlite'
import { ingestMonthly, ingestDaily, ingestYearly, ingestInstant, ingestYearlyEmissions, ingestYearlyInstalled, ingestMonthlyEmissions, ingestMonthlyInstalled, ingestDailyEmissions, ingestDailyBalance, ingestMonthlyBalance, ingestYearlyBalance, ingestHourlyPvpc } from './ingest.js'
import { createEnergyController } from './controllers/energy.js'

const app = express()
const { PORT, DB_FILE, PUBLIC_PATH } = process.env

const oneMinute = 1000 * 60
const oneHour = oneMinute * 60
const oneDay = oneHour * 24

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schema = buildSchema(fs.readFileSync(path.resolve(__dirname, 'schema.graphql')).toString())

const root = db => ({
    latestInstant: async () => {
        const row = await db.get(select.instantLatest(1))
        return row;
    },
    oneYearAgoInstant: async () => {
        return await db.all(select.instantOneMonthFrom('-365 days'))
    },
    lastMonthInstant: async () => {
        return await db.all(select.instantOneMonthFrom('-30 days'))
    },
    oneYearAgoWeekAverage: async () => {
        const oneYearAgo = subDays(new Date(), 365)
        const oneYearAgoWeek = addDays(oneYearAgo, 7)
        const oneYearAgoWeekAverage = await db.get(select.oneYearAgoWeekAverage(
            format(oneYearAgo, 'yyyy-MM-dd'),
            format(oneYearAgoWeek, 'yyyy-MM-dd')
        ))
        return oneYearAgoWeekAverage
    },
    latestInstantByDay: async ({day}) => {
        return await db.all(select.instantLatestByDay(day))
    },
    latestDaily: async ({count = 30}) => {
        const row = await db.all(select.dailyLatest(count))
        return row.reverse()
    },
    latestHourly: async ({count = 72}) => {
        const row = await db.all(select.hourlyLatest(count))
        return row.reverse()
    },
    latestMonthly: async ({count = 12}) => {
        const row = await db.all(select.monthlyLatest(count))
        return row.reverse()
    },
    latestYearly: async ({count = 12}) => {
        const row = await db.all(select.yearlyLatest(count))
        return row.reverse()
    },
    renewablesRecords: async () => {
        const solarRows = await db.all('select strftime("%Y-%m", time) as date, time, max(solarpv) as maxSolar from instant group by date order by maxSolar desc limit 5;')
        const windRows = await db.all('select strftime("%Y-%m", time) as date, time, max(wind) as maxWind from instant group by date order by maxWind desc limit 5;')
        return {
            wind: windRows.map(row => ({time: row.time, value: row.maxWind})),
            solar: solarRows.map(row => ({time: row.time, value: row.maxSolar}))
        }
    }
})


open({
        filename: DB_FILE,
        driver: sqlite3.Database
}).then(adb => {
    const db = adb
    cron.schedule('0,15,30,45 * * * *', () => ingestInstant(db))
    cron.schedule('59 23 * * *', () => {
        ingestDaily(db)
        ingestHourlyPvpc(db)
        //consume instant data from a year ago
        const oneYearAgo = format(subDays(new Date(), 365), 'yyyy-MM-dd')
        ingestInstant(db, oneYearAgo)
    })
    cron.schedule('0 3 */3 * *', () => ingestMonthly(db))
    cron.schedule('0 4 1 * *', () => {
        ingestYearly(db)
        ingestYearlyEmissions(db)
        ingestYearlyBalance(db)
        ingestYearlyInstalled(db)
    })
    cron.schedule('0 5 */3 * *', () => {
        ingestDailyEmissions(db)
        ingestMonthlyEmissions(db)
        ingestDailyBalance(db)
        ingestMonthlyBalance(db)
        ingestMonthlyInstalled(db)
        ingestYearlyInstalled(db)
    })

    const energyController = createEnergyController(db)
    const graphQlController = graphqlHTTP({
        schema,
        rootValue: root(db),
        graphiql: true
    })

    app.use('/graphql', graphQlController)
    app.use('/api/graphql', graphQlController)
    app.use('/api/', energyController)
    app.get('/ingest', async (req, res) => {
        const yearlyValues = await ingestYearly(db)
        const monthlyValues = await ingestMonthly(db)
        const dailyValues = await ingestDaily(db)
        res.send({yearlyValues, monthlyValues, dailyValues})
    })
    app.use('/', energyController)
    app.use(express.static(PUBLIC_PATH))
    app.listen(PORT, () => {
        logger.info('Server started on port ' + PORT)
    })
})

