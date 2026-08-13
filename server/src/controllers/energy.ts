import express, { Router, Request, Response } from 'express';
import type { DatabaseSync } from 'node:sqlite'
import { select } from '../statements.js'

export const createEnergyController = (db: DatabaseSync): Router => {
    const energy = express.Router()

    energy.get('/instant', (req: Request, res: Response) => {
        const row = db.prepare(select.instantLatest(1)).get()
        res.send(row)
    })

    energy.get('/latest', (req: Request, res: Response) => {
        if (req.query.date) {
            const row = db.prepare(select.instantLatestByDay(req.query.date as string)).get()
            res.send(row)
            return
        }
        const row = db.prepare(select.instantLatest(288)).all()
        res.send(row.reverse())
    })

    energy.get('/daily', (req: Request, res: Response) => {
        try{
            const row = db.prepare(select.dailyLatest(30)).all()
            res.send(row.reverse())
        } catch(e) { console.log(e)}
    })

    energy.get('/monthly', (req: Request, res: Response) => {
        const row = db.prepare(select.monthlyLatest(12)).all()
        res.send(row.reverse())
    })

    energy.get('/yearly', (req: Request, res: Response) => {
        const row = db.prepare(select.yearlyLatest(10)).all()
        res.send(row.reverse())
    })

    return energy
}
