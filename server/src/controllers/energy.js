import express from 'express';
import { select } from '../statements.js'

export const createEnergeController = db => {
    const energy = express.Router()

    energy.get('/instant', async (req, res) => {
        const row = await db.get(select.instantLast)
        res.send(row)
    })

    energy.get('/latest', async (req, res) => {
        const row = await db.all(select.instantLatest)
        res.send(row.reverse())
    })

    energy.get('/daily', async (req, res) => {
        try{
        const row = await db.all(select.dailyLatest)
        res.send(row.reverse())
        }catch(e) { console.log(e)}
    })

    energy.get('/monthly', async (req, res) => {
        const row = await db.all(select.monthlyLatest)
        res.send(row.reverse())
    })

    energy.get('/yearly', async (req, res) => {
        const row = await db.all(select.yearlyLatest)
        res.send(row.reverse())
    })

    return energy
}

