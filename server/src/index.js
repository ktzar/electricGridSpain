import fs from 'fs'
import { fileURLToPath } from 'url';

import path from 'path'
import express from 'express'
import dotenv from 'dotenv'
dotenv.config()
import { select } from './statements.js'
import { graphqlHTTP } from 'express-graphql'
import { buildSchema } from 'graphql'
import sqlite3 from 'sqlite3'
import {open} from 'sqlite'
import { ingestMonthly, ingestDaily, ingestYearly, ingestInstant } from './ingest.js'
import { createEnergeController } from './controllers/energy.js'

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
        const row = await db.get(select.instantLast)
        return row;
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
    }
})

open({
        filename: DB_FILE,
        driver: sqlite3.Database
}).then(adb => {
    const db = adb
    ingestInstant(db)
    setInterval(() => { ingestInstant(db) }, oneMinute * 30)
    setInterval(() => { ingestDaily(db) }, oneHour * 12)
    setInterval(() => { ingestYearly(db); ingestMonthly(db) }, oneDay * 3)
    const energyController = createEnergeController(db)
    const graphQlController = graphqlHTTP({
        schema,
        rootValue: root(db),
        graphiql: true
    })

    app.use('/graphql', graphQlController)
    app.use('/api/graphql', graphQlController)
    app.use('/api/', energyController)
    app.use('/', energyController)
    app.use(express.static(PUBLIC_PATH))
    app.listen(PORT, () => {
        console.log('Server started on port ' + PORT)
    })
})

