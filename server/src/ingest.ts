import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'url'
import argsParser from 'args-parser'
import { parseISO, format, subDays, addDays } from 'date-fns'
import dotenv from 'dotenv'
dotenv.config()
import parseJsonp from 'parse-jsonp'
import axios from 'axios'
import logger from './logger.js'
import { ingest } from './statements.js'
const { PORT, DB_FILE, PUBLIC_PATH } = process.env

const args = argsParser(process.argv)

const axiosOptions = {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.83 Safari/537.36' }
};

function valuesToDates(res: any, dateFormat: string, extraDays = 0) {
    const values: Record<string, Record<string, any>> = {}
    for (let v of res.data.included) {
        const readingType = readingMappings[v.type as string]
        if (!readingType) {
            logger.info('Unknown type ' + v.type)
            continue;
        }
        for (let reading of v.attributes.values) {
            const readingDate = format(addDays(parseISO(reading.datetime), extraDays), dateFormat)
            logger.info({readingDate})
            if (!values[readingDate]) {
                values[readingDate] = {}
            }
            values[readingDate][readingType] = reading.value;
        }
    }
    return values
}

const API_BASE = 'https://apidatos.ree.es/en/datos'

const getPvpcUrl = (startDate: string, endDate: string, trunc: string) =>
    `${API_BASE}/mercados/precios-mercados-tiempo-real?start_date=${startDate}&end_date=${endDate}&time_trunc=${trunc}`

const getGeneracionUrl = (startDate: string, endDate: string, trunc: string) =>
    `${API_BASE}/generacion/estructura-generacion?start_date=${startDate}&end_date=${endDate}&time_trunc=${trunc}`

const getEmisionesUrl = (startDate: string, endDate: string, trunc: string) =>
    `${API_BASE}/generacion/no-renovables-detalle-emisiones-CO2?start_date=${startDate}&end_date=${endDate}&time_trunc=${trunc}`

const getDemandaUrl = (date: string) =>
    `https://demanda.ree.es/WSvisionaMovilesPeninsulaRest/resources/demandaGeneracionPeninsula?callback=callback&fecha=${date}`

const getBalanceUrl = (startDate: string, endDate: string, type: string, country: string) =>
    `${API_BASE}/intercambios/${country}-frontera?start_date=${startDate}&end_date=${endDate}&time_trunc=${type}`

const getInstalledUrl = (startDate: string, endDate: string, type: string) =>
    `${API_BASE}/generacion/potencia-instalada?start_date=${startDate}&end_date=${endDate}&time_trunc=${type}`

export async function ingestInstant(db: DatabaseSync, overrideDate?: string) {
    try {
        const date = overrideDate || format(new Date(), 'yyyy-MM-dd')
        const reqUrl = getDemandaUrl(date)
        logger.info(`Requesting ${reqUrl}`)

        const res = await axios.get(reqUrl, axiosOptions)
        const data = parseJsonp('callback', res.data)
        const values = data.valoresHorariosGeneracion
        if (!Array.isArray(values) || values.length === 0) {
            logger.warn('Instant API response has no valoresHorariosGeneracion entries, skipping ingestion')
            return
        }
        logger.info(`Number of values ingested ${values.length}`)

        // coerces an API field to a number, defaulting missing/unexpected values to 0,
        // and logs a warning the first time a field is absent so response shape
        // changes are visible in the logs instead of silently storing zeros
        const missingKeys = new Set<string>()
        const read = (v: Record<string, any>, key: string) => {
            if (v[key] === undefined && !missingKeys.has(key)) {
                missingKeys.add(key)
                logger.warn(`Instant API response missing field '${key}', storing 0`)
            }
            const n = Number(v[key])
            return Number.isNaN(n) ? 0 : n
        }

        let updatedRowsCount = 0
        let lastInsertRowid = 0
        for (const v of values) {
            //ignore time saving codes
            if (typeof v.ts !== 'string' || v.ts.indexOf('A') + v.ts.indexOf('B') > 0) {
                continue
            }
            const res = db.prepare(ingest.instant).run(
                v.ts,
                read(v, 'solFot'), read(v, 'eol'), read(v, 'solTer'), read(v, 'hid'),
                read(v, 'nuc'), read(v, 'cogenResto'), read(v, 'cc'), read(v, 'car'),
                read(v, 'bio'), read(v, 'inter'), read(v, 'bat'), read(v, 'consBat'),
            )
            lastInsertRowid = Number(res.lastInsertRowid)
            if (res.lastInsertRowid > 0) {
                updatedRowsCount++
            }
        }
        logger.info(`Updated ${updatedRowsCount} rows. Last ID: ${lastInsertRowid}`)
    } catch (e: any) {

        logger.error(`Error when updating instant data ${e}`)
        logger.error(e.stack)
    }
}

const readingMappings: Record<string, string> = {
    Hydro: 'hydro',
    //'Pumped storage':
    Nuclear: 'nuclear',
    Coal: 'coal',
    //'Diesel Engines': '
    //'Gas turbine'.,
    //'Steam turbine'.,
    'Combined cycle': 'gas',
    Wind: 'wind',
    'Solar photovoltaic': 'solarpv',
    'Thermal solar': 'solarthermal',
    Cogeneration: 'cogen',
    'PVPC (€/MWh)': 'pvpc',
    'PVPC': 'pvpc',
}

const installedIngestionMapping: Record<string, string> = {
    'Wind': 'Wind',
    'Hydro': 'Hydro',
    'Solar photovoltaic': 'Solar',
    'Pumped storage': 'Pumped',
    'Thermal solar': 'Thermalsolar',
    'Coal': 'Carbon',
    'Nuclear': 'Nuclear',
}

export async function ingestYearlyInstalled(db: DatabaseSync) {
    const startDate = format(subDays(new Date(), 365*3), 'yyyy-01-01')
    const endDate = format(new Date(), 'yyyy-MM-dd')
    const reqUrl = getInstalledUrl(startDate, endDate, 'year')
    try {
        const res = await axios.get(reqUrl, axiosOptions)
        const energies = res.data.included.filter((e: any) => installedIngestionMapping[e.type])
        for (const energy of energies) {
            for (const value of energy.attributes.values) {
                const installed = value.value
                if (!installed) continue
                const dayDate = value.datetime.substring(0, 4)
                const statement = ingest.yearlyInstalled(installedIngestionMapping[energy.type])
                db.prepare(statement).run(dayDate, installed)
            }
        }
    } catch (e) {
        console.error(e)
    }
}

export async function ingestMonthlyInstalled(db: DatabaseSync) {
    const startDate = format(subDays(new Date(), 30*22), 'yyyy-MM-01')
    const endDate = format(new Date(), 'yyyy-MM-dd')
    const reqUrl = getInstalledUrl(startDate, endDate, 'month')
    try {
        const res = await axios.get(reqUrl, axiosOptions)
        const energies = res.data.included.filter((e: any) => installedIngestionMapping[e.type])
        for (const energy of energies) {
            for (const value of energy.attributes.values) {
                const installed = value.value
                if (!installed) continue
                const monthDate = value.datetime.substring(0, 7)
                const statement = ingest.monthlyInstalled(installedIngestionMapping[energy.type])
                db.prepare(statement).run(monthDate, installed)
            }
        }
    } catch (e) {
        console.error(e)
    }
}

export async function ingestDailyBalance(db: DatabaseSync) {
    const startDate = format(subDays(new Date(), 30), 'yyyy-MM-dd')
    const endDate = format(subDays(new Date(), 1), 'yyyy-MM-dd')
    await ingestBalanceForCountryAndType(db, startDate, endDate, 'francia', 'day', 10, ingest.dailyBalance('France'))
    await ingestBalanceForCountryAndType(db, startDate, endDate, 'marruecos', 'day', 10, ingest.dailyBalance('Morocco'))
    await ingestBalanceForCountryAndType(db, startDate, endDate, 'portugal', 'day', 10, ingest.dailyBalance('Portugal'))
}

export async function ingestMonthlyBalance(db: DatabaseSync) {
    const startDate = format(subDays(new Date(), 30*22), 'yyyy-MM-01')
    const endDate = format(new Date(), 'yyyy-MM-dd')
    await ingestBalanceForCountryAndType(db, startDate, endDate, 'francia', 'month', 7, ingest.monthlyBalance('France'))
    await ingestBalanceForCountryAndType(db, startDate, endDate, 'marruecos', 'month', 7, ingest.monthlyBalance('Morocco'))
    await ingestBalanceForCountryAndType(db, startDate, endDate, 'portugal', 'month', 7, ingest.monthlyBalance('Portugal'))
}

export async function ingestYearlyBalance(db: DatabaseSync) {
    const startDate = '2017-01-01'//format(subDays(new Date(), 365*11), 'yyyy-01-01')
    const endDate = '2018-12-31'
    //const endDate = format(subDays(new Date(), 1), 'yyyy-MM-dd')
    await ingestBalanceForCountryAndType(db, startDate, endDate, 'francia', 'year', 4, ingest.yearlyBalance('France'))
    await ingestBalanceForCountryAndType(db, startDate, endDate, 'marruecos', 'year', 4, ingest.yearlyBalance('Morocco'))
    await ingestBalanceForCountryAndType(db, startDate, endDate, 'portugal', 'year', 4, ingest.yearlyBalance('Portugal'))
}

export async function ingestDailyEmissions(db: DatabaseSync) {
    const startDate = format(subDays(new Date(), 90), 'yyyy-MM-dd')
    const endDate = format(subDays(new Date(), 1), 'yyyy-MM-dd')
    ingestEmissionsForType(db, startDate, endDate, 'day', 10, ingest.dailyEmissions)
}

export async function ingestMonthlyEmissions(db: DatabaseSync) {
    const startDate = format(subDays(new Date(), 30*22), 'yyyy-MM-01')
    const endDate = format(new Date(), 'yyyy-MM-dd')
    ingestEmissionsForType(db, startDate, endDate, 'month', 7, ingest.monthlyEmissions)
}

export async function ingestYearlyEmissions(db: DatabaseSync) {
    const startDate = format(subDays(new Date(), 365*3), 'yyyy-01-01')
    //const endDate = format(subDays(new Date(), 365*12), 'yyyy-12-31')
    const endDate = format(new Date(), 'yyyy-MM-dd')
    ingestEmissionsForType(db, startDate, endDate, 'year', 4, ingest.yearlyEmissions)
}

async function ingestBalanceForCountryAndType(db: DatabaseSync, startDate: string, endDate: string, country: string, type: string, dateTruncLength: number, sqlStatement: string) {
    const reqUrl = getBalanceUrl(startDate, endDate, type, country)
    try {
        const res = await axios.get(reqUrl, axiosOptions)
        const values = res.data.included.find((a: any) => a.type === 'saldo').attributes.values
        for (const value of values) {
            const balance = value.value
            if (!balance) continue
            const dayDate = value.datetime.substring(0, dateTruncLength)
            db.prepare(sqlStatement).run(dayDate, balance)
        }
    } catch (e) {
        console.error(e)
    }
}

async function ingestEmissionsForType(db: DatabaseSync, startDate: string, endDate: string, type: string, dateTruncLength: number, sqlStatement: string) {
    const reqUrl = getEmisionesUrl(startDate, endDate, type)
    try {
        const res = await axios.get(reqUrl, axiosOptions)
        const filteredRes = res.data.included.filter((d: any) => d.type === 'tCO2 eq./MWh')
        if (filteredRes.length > 0) {
            const emissions = filteredRes[0]
            if (type === 'day') {
                // remove last item of values array, as it is the current day and it comes with errors
                emissions.attributes.values.pop()
            }
            for (const value of emissions.attributes.values) {
                // get first X characters of date
                const dayDate = value.datetime.substring(0, dateTruncLength)
                //convert from tons per MWh to grams per kWh
                const emissions = parseFloat((value.value * 1000).toFixed(2))
                db.prepare(sqlStatement).run(dayDate, emissions)
                logger.info(`Updated ${type} emissions for ${dayDate} with value ${emissions}`)
            }
        }
    } catch(e: any) {
        logger.error(`Error updating daily emissions ${e}`)
        logger.error(e.stack)
    }
}

export async function ingestDaily(db: DatabaseSync) {
    const startDate = format(subDays(new Date(), 25), 'yyyy-MM-dd')
    const endDate = format(new Date(), 'yyyy-MM-dd')
    const reqUrl = getGeneracionUrl(startDate, endDate, 'day')
    logger.info(`Ingesting daily on ${reqUrl}`)

    try {
        const res = await axios.get(reqUrl, axiosOptions)
        const values = valuesToDates(res, 'yyyy-MM-dd')
        logger.info(`Values received have a length of ${values}`)

        for (const date in values) {
            const readings = values[date]
            const res = db.prepare(ingest.daily).run(date, readings.solarpv, readings.wind, readings.solarthermal, readings.hydro, readings.nuclear, readings.cogen, readings.gas, readings.coal)
            logger.info(`last id of values inserted for day ${date}: ${res.lastInsertRowid}`)
        }
        return values
    } catch(e: any) {
        logger.error(`Error updating daily data ${e}`)
        logger.error(e.stack)
        return { error: true, message: `${e}` }
    }
}

export async function ingestHourlyPvpc(db: DatabaseSync) {
    const startDate = format(subDays(new Date(), 0), 'yyyy-MM-dd')
    const endDate = format(addDays(new Date(), 2), 'yyyy-MM-dd')
    const reqUrl = getPvpcUrl(startDate, endDate, 'hour')
    logger.info(`Ingesting hourly from ${reqUrl}`)

    try {
        const res = await axios.get(reqUrl, axiosOptions)
        const values = valuesToDates(res, 'yyyy-MM-dd HH')
        logger.info(`Values received have a length of ${(values as any).length}`)

        for (const hour in values) {
            const readings = values[hour]
            console.log(ingest.hourlyPvpc, [hour, readings.pvpc])
            const res = db.prepare(ingest.hourlyPvpc).run(hour, readings.pvpc)
            logger.info(`last id of values inserted ${res.lastInsertRowid}`)
            logger.info(`changes ${res.changes}`)
        }
        return values
    } catch(e: any) {
        const message = `Error updating hourly pvpc data ${e}`
        logger.error(message)
        return { error: true, message }
    }
}


export async function ingestMonthly(db: DatabaseSync) {
    const startDate = format(subDays(new Date(), 30*22), 'yyyy-MM-01')
    const endDate = format(new Date(), 'yyyy-MM-dd')
    const reqUrl = getGeneracionUrl(startDate, endDate, 'month')
    logger.info(`Ingesting monthly from ${reqUrl}`)

    try {
        const res = await axios.get(reqUrl, axiosOptions)
        const values = valuesToDates(res, 'yyyy-MM', 1)
        logger.info(values)

        for (const date in values) {
            const readings = values[date]
            const columnValues = [date, readings.solarpv, readings.wind, readings.solarthermal, readings.hydro, readings.nuclear, readings.cogen, readings.gas, readings.coal]
            logger.info("Running", ingest.monthly, "with", columnValues)
            const res = db.prepare(ingest.monthly).run(...columnValues)
            logger.info(res.lastInsertRowid)
        }
        return values
    } catch(e: any) {
        const message =`Error updating monthly data ${e}`
        logger.error(message)
        return { error: true, message }
    }
}

export async function ingestYearly(db: DatabaseSync) {
    const startDate = format(subDays(new Date(), 365*4), 'yyyy-01-01')
    const endDate = format(new Date(), 'yyyy-MM-dd')
    const reqUrl = getGeneracionUrl(startDate, endDate, 'year')
    logger.info(`Ingesting yearly from ${reqUrl}`)

    try {
        const res = await axios.get(reqUrl, axiosOptions)
        const values = valuesToDates(res, 'yyyy', 1)
        logger.info(values)

        for (const date in values) {
            const readings = values[date]
            const res = db.prepare(ingest.year).run(date, readings.solarpv, readings.wind, readings.solarthermal, readings.hydro, readings.nuclear, readings.cogen, readings.gas, readings.coal)
            logger.info(res.lastInsertRowid)
        }
    } catch(e: any) {
        const message = `Error updating yearly data ${e}`
        logger.error(message)
        return { error: true, message }
    }
}

// map of arguments to functions
const argMapToFunctions: Record<string, Array<(db: DatabaseSync, arg?: any) => Promise<any>>> = {
    'all': [ingestInstant, ingestDaily, ingestMonthly, ingestYearly],
    'emissions': [ingestDailyEmissions, ingestMonthlyEmissions, ingestYearlyEmissions],
    'balance': [ingestDailyBalance, ingestMonthlyBalance, ingestYearlyBalance],
    'installed': [ingestMonthlyInstalled, ingestYearlyInstalled],
    'daily': [ingestDaily, ingestDailyBalance, ingestDailyEmissions],
    'monthly': [ingestMonthly, ingestMonthlyBalance, ingestMonthlyInstalled, ingestMonthlyEmissions],
    'yearly': [ingestYearly, ingestYearlyEmissions, ingestYearlyInstalled, ingestYearlyBalance],
    'instant': [ingestInstant],
    'pvpc': [ingestHourlyPvpc],
}

// only run the CLI ingestion when this file is executed directly, not when imported by the server
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const db = new DatabaseSync(DB_FILE)
    try {
        if (argMapToFunctions[args.data]) {
            for (const func of argMapToFunctions[args.data]) {
                await func(db)
                logger.info('Processed ' + func.name)
            }
        } else {
            console.log("Data type not recognised. Supported types are " + Object.keys(argMapToFunctions).join(', '))
            logger.info(`${args.data} data type not recognised`)
        }
    } catch(e: any) {
        logger.info(e.response || e)
    }
}
