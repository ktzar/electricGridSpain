import express from 'express'
import dotenv from 'dotenv'
dotenv.config()
import sqlite3 from 'sqlite3'
import {open} from 'sqlite'
import { ingestMonthly, ingestDaily, ingestYearly, ingestInstant } from './ingest.js'
import { createEnergeController } from './controllers/energy.js'

console.log(process.env)

const app = express()
const { PORT, DB_FILE, PUBLIC_PATH } = process.env

const oneHour = 1000 * 60 * 60
const oneDay = oneHour * 24

open({
        filename: DB_FILE,
        driver: sqlite3.Database
}).then(adb => {
    const db = adb
    setInterval(() => { ingestInstant(db) }, oneHour)
    setInterval(() => { ingestDaily(db) }, oneHour * 12)
    setInterval(() => { ingestMonthly(db) }, oneDay * 3)
    //setInterval(() => { ingestYearly(db) }, oneDay * 30)
    const energyController = createEnergeController(db)

    app.use('/api/', energyController)
    app.use('/', energyController)
    app.use(express.static(PUBLIC_PATH))
    app.listen(PORT, () => {
        console.log('Server started on port ' + PORT)
    })
})

