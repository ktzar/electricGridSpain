import express from 'express'
import sqlite3 from 'sqlite3'
import {open} from 'sqlite'
import { ingestInstant } from './ingest.js'
import { select } from './statements.js'

const app = express()
let db

const oneHour = 1000 * 60 * 60

function ingestInstantForever() {
    ingestInstant(db)
    setTimeout(ingestInstantForever, oneHour)
}

app.get('/instant', async (req, res) => {
    const row = await db.get(select.instantLast)
    res.send(row)
})

app.get('/latest', async (req, res) => {
    const row = await db.all(select.instantLatest)
    res.send(row.reverse())
})

app.get('/daily', async (req, res) => {
    const row = await db.all(select.dailyLatest)
    res.send(row.reverse())
})

app.get('/monthly', async (req, res) => {
    const row = await db.all(select.monthlyLatest)
    res.send(row.reverse())
})

app.get('/yearly', async (req, res) => {
    const row = await db.all(select.yearlyLatest)
    res.send(row.reverse())
})

open({
        filename: './database.db',
        driver: sqlite3.Database
}).then(adb => {
    db = adb
    ingestInstantForever()
    app.listen('9000', () => {
        console.log('Server started')
    })
})

