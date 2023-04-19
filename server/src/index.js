import fs from 'fs'
import { fileURLToPath } from 'url';

import path from 'path'
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
import { ingestMonthly, ingestDaily, ingestYearly, ingestInstant } from './ingest.js'
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
    latestInstantByDay: async ({day}) => {
        return await db.all(select.instantLatestByDay(day))
    },
    latestDaily: async ({count = 30}) => {
        const row = await db.all(select.dailyLatest(count))
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
    renewablesRecord: async () => {
        const solarRow = await db.get('select max(solarpv) as solarpv, time from instant')
        const windRow = await db.get('select max(wind) as wind, time from instant')
        return {
            windTime: windRow.time,
            windValue: windRow.wind,
            solarpvTime: solarRow.time,
            solarpvValue: solarRow.solarpv
        }
    }
})


open({
        filename: DB_FILE,
        driver: sqlite3.Database
}).then(adb => {
    const db = adb
    cron.schedule('0,15,30,45 * * * *', () => ingestInstant(db))
    cron.schedule('59 23 * * *', () => ingestDaily(db))
    cron.schedule('0 3 */3 * *', () => ingestMonthly(db))
    cron.schedule('0 4 1 * *', () => ingestYearly(db))

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

