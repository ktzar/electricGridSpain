import fs from 'fs'
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';
import { createCache } from 'simple-in-memory-cache';

import cors from 'cors'
import path from 'path'
import { format, subDays } from 'date-fns'
import express from 'express'
import dotenv from 'dotenv'
import logger from './logger.js'
import { select } from './statements.js'
import { createHandler } from 'graphql-http/lib/use/express';
import { buildSchema } from 'graphql'
import cron from 'node-cron'
import { ingestMonthly,
	ingestDaily,
	ingestYearly,
	ingestInstant,
	ingestYearlyEmissions,
	ingestYearlyInstalled,
	ingestMonthlyEmissions,
	ingestMonthlyInstalled,
	ingestDailyEmissions,
	ingestDailyBalance,
	ingestMonthlyBalance,
	ingestYearlyBalance,
	ingestHourlyPvpc,
} from './ingest.js'
import { createEnergyController } from './controllers/energy.js'

dotenv.config()
const { get, set } = createCache();

const corsOptions = {
    credentials: true,
    origin: ['http://localhost:3000', 'http://energy.ktzar.uk', 'http://energy.ktzar.uk'] // Whitelist the domains you want to allow
};

const app = express()
app.use(cors(corsOptions));

const { PORT, DB_FILE, PUBLIC_PATH } = process.env

const db = new DatabaseSync(DB_FILE);

console.log(`Using database in ${DB_FILE}`);

const oneMinute = 1000 * 60
const oneHour = oneMinute * 60
const oneDay = oneHour * 24

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schema = buildSchema(fs.readFileSync(path.resolve(__dirname, 'schema.graphql')).toString())

const root = (db: DatabaseSync) => ({
    latestInstant: () => {
        return db.prepare(select.instantLatest(1)).get()
    },
    oneYearAgoInstant: () => {
        return db.prepare(select.instantOneMonthFrom('-365 days')).all()
    },
    lastMonthInstant: () => {
        return db.prepare(select.instantOneMonthFrom('-30 days')).all()
    },
    oneYearAgoWeekAverage: () => {
        return db.prepare(select.instantOneMonthFrom('-365 days')).all()
    },
    latestInstantByDay: ({day}: {day: string}) => {
        return db.prepare(select.instantLatestByDay(day)).all()
    },
    latestDaily: ({count = 30}) => {
        const row = db.prepare(select.dailyLatest(count)).all()
        return row.reverse()
    },
    latestHourly: ({count = 72}) => {
        const row = db.prepare(select.hourlyLatest(count)).all()
        return row.reverse()
    },
    latestMonthly: ({count = 12}) => {
        const row = db.prepare(select.monthlyLatest(count)).all()
        return row.reverse()
    },
    latestYearly: ({count = 12}) => {
        const row = db.prepare(select.yearlyLatest(count)).all()
        return row.reverse()
    },
    dailyBattery: ({count = 10}) => {
        const row = db.prepare(select.dailyBattery(count)).all()
        return row;
    },
    renewablesRecords: () => {
        let ret = get('renewablesRecords');
        if (ret === undefined) {
            const solarrows = db.prepare("select strftime('%Y-%m', time) as date, time, max(solarpv) as maxsolar from instant group by date order by maxsolar desc limit 5;").all()
            const batrows = db.prepare("select strftime('%Y-%m', time) as date, time, max(bat) as maxbat from instant group by date order by maxbat desc limit 5;").all()
            const consbatrows = db.prepare("select strftime('%Y-%m', time) as date, time, max(-consbat) as maxconsbat from instant group by date order by maxconsbat desc limit 5;").all()
            const windrows = db.prepare("select strftime('%Y-%m', time) as date, time, max(wind) as maxwind from instant group by date order by maxwind desc limit 5;").all()
            ret = {
                bat: batrows.map((row: any) => ({time: row.time, value: row.maxbat})),
                consBat: consbatrows.map((row: any) => ({time: row.time, value: row.maxconsbat})),
                wind: windrows.map((row: any) => ({time: row.time, value: row.maxwind})),
                solar: solarrows.map((row: any) => ({time: row.time, value: row.maxsolar}))
            }
            set('renewablesRecords', ret);
        }
        return ret;
    },
    renewablesRecordsV2: () => {
        let ret = get('renewablesRecordsV2');
        if (ret === undefined) {
            const queries = {
                solar: select.records(40000, 10000, 1000, 'solarpv'),
                wind: select.records(25000, 10000, 1000, 'wind'),
                bat: select.records(500, 30, 10, 'bat'),
                consbat: select.records(500, 30, 10, '-consbat')
            };
            console.log(queries);
            ret = {
                solar: db.prepare(queries.solar).all().map((row: any) => ({time: row.time, value: row.value})),
                wind: db.prepare(queries.wind).all().map((row: any) => ({time: row.time, value: row.value})),
                bat: db.prepare(queries.bat).all().map((row: any) => ({time: row.time, value: row.value})),
                consBat: db.prepare(queries.consbat).all().map((row: any) => ({time: row.time, value: row.value}))
            }
            set('renewablesRecordsV2', ret, { expiration: { minutes: 60 }});
        }
        return ret;
    }
})


const CRONS = {
	INSTANT: '0,15,30,45 * * * *',
	PVPC: '0 */4 * * *',
	DAILY: '59 23 * * *',
	MONTHLY: '0 3 */3 * *',
	YEARLY: '0 4 */6 * *',
	OTHER: '0 5 */3 * *',
};

cron.schedule(CRONS.INSTANT, () => ingestInstant(db))
cron.schedule(CRONS.PVPC, () => ingestHourlyPvpc(db))
cron.schedule(CRONS.DAILY, () => {
    ingestDaily(db)
    const oneYearAgo = format(subDays(new Date(), 365), 'yyyy-MM-dd')
    ingestInstant(db, oneYearAgo)
})
cron.schedule(CRONS.MONTHLY, () => ingestMonthly(db))
cron.schedule(CRONS.YEARLY, () => {
    ingestYearly(db)
    ingestYearlyEmissions(db)
    ingestYearlyBalance(db)
    ingestYearlyInstalled(db)
})
cron.schedule(CRONS.OTHER, () => {
    ingestDailyEmissions(db)
    ingestMonthlyEmissions(db)
    ingestDailyBalance(db)
    ingestMonthlyBalance(db)
    ingestMonthlyInstalled(db)
    ingestYearlyInstalled(db)
})

const energyController = createEnergyController(db)
app.all('/graphql', createHandler({ schema, rootValue: root(db) }));
app.all('/api/graphql', createHandler({ schema, rootValue: root(db) }));
app.use('/api/', energyController)
app.get('/ingest', (req, res) => {
    const yearlyValues = ingestYearly(db)
    const monthlyValues = ingestMonthly(db)
    const dailyValues = ingestDaily(db)
    res.send({yearlyValues, monthlyValues, dailyValues})
})
app.use('/', energyController)
app.use(express.static(PUBLIC_PATH || ''))
app.listen(PORT, () => {
    logger.info('Server started on port ' + PORT)
})
