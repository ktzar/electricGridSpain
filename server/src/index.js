import express from 'express'
import dotenv from 'dotenv'
import { select } from './statements.js'
dotenv.config()
import { graphqlHTTP } from 'express-graphql'
import { buildSchema } from 'graphql'
import sqlite3 from 'sqlite3'
import {open} from 'sqlite'
import { ingestMonthly, ingestDaily, ingestYearly, ingestInstant } from './ingest.js'
import { createEnergeController } from './controllers/energy.js'

const app = express()
const { PORT, DB_FILE, PUBLIC_PATH } = process.env

const oneHour = 1000 * 60 * 60
const oneDay = oneHour * 24

const schema = buildSchema(`
interface Measurement {
    solarpv: Float,
    wind: Float,
    solarthermal: Float,
    nuclear: Float,
    hidro: Float,
    inter: Float,
    thermal: Float,
    cogen: Float,
    gas: Float,
    carbon: Float,
}

type Instant implements Measurement {
    time: String!
    solarpv: Float,
    wind: Float,
    solarthermal: Float,
    nuclear: Float,
    hidro: Float,
    inter: Float,
    thermal: Float,
    cogen: Float,
    gas: Float,
    carbon: Float,
}

type Day implements Measurement {
    day: String!
    solarpv: Float,
    wind: Float,
    solarthermal: Float,
    nuclear: Float,
    hidro: Float,
    inter: Float,
    thermal: Float,
    cogen: Float,
    gas: Float,
    carbon: Float,
}

type Month implements Measurement {
    month: String!
    solarpv: Float,
    wind: Float,
    solarthermal: Float,
    nuclear: Float,
    hidro: Float,
    inter: Float,
    thermal: Float,
    cogen: Float,
    gas: Float,
    carbon: Float,
}

type Year implements Measurement {
    year: String!
    solarpv: Float,
    wind: Float,
    solarthermal: Float,
    nuclear: Float,
    hidro: Float,
    inter: Float,
    thermal: Float,
    cogen: Float,
    gas: Float,
    carbon: Float,
}

 type Query {
     latestInstant: Instant,
     latestDaily(count: Int): [Day],
     latestMonthly(count: Int): [Month],
     latestYearly(count: Int): [Year]
 }
`)

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
    //setInterval(() => { ingestInstant(db) }, oneHour)
    //setInterval(() => { ingestDaily(db) }, oneHour * 12)
    //setInterval(() => { ingestMonthly(db) }, oneDay * 3)
    //setInterval(() => { ingestYearly(db) }, oneDay * 30)
    const energyController = createEnergeController(db)

    app.use('/graphql', graphqlHTTP({
        schema,
        rootValue: root(db),
        graphiql: true
    }))
    app.use('/api/', energyController)
    app.use('/', energyController)
    app.use(express.static(PUBLIC_PATH))
    app.listen(PORT, () => {
        console.log('Server started on port ' + PORT)
    })
})

