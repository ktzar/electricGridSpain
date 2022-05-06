const express = require('express')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')

const app = express()
let db

const statements = {
    instantLast: 'select * from instant order by time desc limit 0,1',
    instantLatest: 'select * from instant order by time desc limit 0,144',
    dailyLatest: 'select * from daily order by day desc limit 0,30',
    monthlyLatest: 'select * from monthly order by month desc limit 0,30',
    yearlyLatest: 'select * from yearly order by year desc limit 0,30'
}

app.get('/instant', async (req, res) => {
    const row = await db.get(statements.instantLast)
    res.send(row)
})

app.get('/latest', async (req, res) => {
    const row = await db.all(statements.instantLatest)
    res.send(row)
})

app.get('/daily', async (req, res) => {
    const row = await db.all(statements.dailyLatest)
    res.send(row)
})

app.get('/monthly', async (req, res) => {
    const row = await db.all(statements.monthlyLatest)
    res.send(row)
})

app.get('/yearly', async (req, res) => {
    const row = await db.all(statements.yearlyLatest)
    res.send(row)
})

open({
        filename: './database.db',
        driver: sqlite3.Database
}).then(adb => {
    db = adb
    app.listen('9000', () => {
        console.log('Server started')
    })
})

