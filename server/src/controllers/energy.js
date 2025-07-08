import express from 'express';
import { select } from '../statements.js'

export const createEnergyController = db => {
    const energy = express.Router()

    energy.get('/instant', async (req, res) => {
        const row = await db.get(select.instantLatest(1))
        res.send(row)
    })

    energy.get('/latest', async (req, res) => {
        if (req.query.date) {
            const row = await db.get(select.instantLatestByDay(req.query.date))
            res.send(row)
            return
        }
        const row = await db.all(select.instantLatest24h())
        res.send(row.reverse())
    })

    energy.get('/daily', async (req, res) => {
        try{
            const row = await db.all(select.dailyLatest(30))
            res.send(row.reverse())
        } catch(e) { console.log(e)}
    })

    energy.get('/monthly', async (req, res) => {
        const row = await db.all(select.monthlyLatest(12))
        res.send(row.reverse())
    })

    energy.get('/yearly', async (req, res) => {
        const row = await db.all(select.yearlyLatest(10))
        res.send(row.reverse())
    })

    return energy
}

