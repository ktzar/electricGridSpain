import express, { Router, Request, Response } from 'express';
import type { Database } from 'sqlite'
import { select } from '../statements.js'

export const createEnergyController = (db: Database): Router => {
    const energy = express.Router()

    energy.get('/instant', async (req: Request, res: Response) => {
        const row = await db.get(select.instantLatest(1))
        res.send(row)
    })

    energy.get('/latest', async (req: Request, res: Response) => {
        if (req.query.date) {
            const row = await db.get(select.instantLatestByDay(req.query.date as string))
            res.send(row)
            return
        }
        const row = await db.all(select.instantLatest(288))
        res.send(row.reverse())
    })

    energy.get('/daily', async (req: Request, res: Response) => {
        try{
            const row = await db.all(select.dailyLatest(30))
            res.send(row.reverse())
        } catch(e) { console.log(e)}
    })

    energy.get('/monthly', async (req: Request, res: Response) => {
        const row = await db.all(select.monthlyLatest(12))
        res.send(row.reverse())
    })

    energy.get('/yearly', async (req: Request, res: Response) => {
        const row = await db.all(select.yearlyLatest(10))
        res.send(row.reverse())
    })

    return energy
}
