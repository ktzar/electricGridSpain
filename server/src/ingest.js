import sqlite3 from 'sqlite3'
import argsParser from 'args-parser'
import { parseISO, format, subDays, addDays } from 'date-fns'
import dotenv from 'dotenv'
dotenv.config()
import {open} from 'sqlite'
import parseJsonp from 'parse-jsonp'
import axios from 'axios'
import logger from './logger.js'
import { ingest } from './statements.js'
const { PORT, DB_FILE, PUBLIC_PATH } = process.env

const args = argsParser(process.argv)

const axiosOptions = {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.83 Safari/537.36' }
};

function valuesToDates(res, dateFormat, extraDays = 0) {
    const values = {}
    for (let v of res.data.included) {
        const readingType = readingMappings[v.type]
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

const getPvpcUrl = (startDate, endDate, trunc) =>
    `${API_BASE}/mercados/precios-mercados-tiempo-real?start_date=${startDate}&end_date=${endDate}&time_trunc=${trunc}`

const getGeneracionUrl = (startDate, endDate, trunc) =>
    `${API_BASE}/generacion/estructura-generacion?start_date=${startDate}&end_date=${endDate}&time_trunc=${trunc}`

const getEmisionesUrl = (startDate, endDate, trunc) =>
    `${API_BASE}/generacion/no-renovables-detalle-emisiones-CO2?start_date=${startDate}&end_date=${endDate}&time_trunc=${trunc}`

const getDemandaUrl = date =>
    `https://demanda.ree.es/WSvisionaMovilesPeninsulaRest/resources/demandaGeneracionPeninsula?callback=callback&fecha=${date}`

const getBalanceUrl = (startDate, endDate, type, country) =>
    `${API_BASE}/intercambios/${country}-frontera?start_date=${startDate}&end_date=${endDate}&time_trunc=${type}`

const getInstalledUrl = (startDate, endDate, type) =>
    `${API_BASE}/generacion/potencia-instalada?start_date=${startDate}&end_date=${endDate}&time_trunc=${type}`

export async function ingestInstant(db, overrideDate) {
    try {
        const date = overrideDate || format(new Date(), 'yyyy-MM-dd')
        const reqUrl = getDemandaUrl(date)
        logger.info(`Requesting ${reqUrl}`)

        const res = await axios.get(reqUrl, axiosOptions)
        const data = parseJsonp('callback', res.data)
        logger.info(`Number of values ingested ${data.valoresHorariosGeneracion.length}`)

        let updatedRowsCount = 0
        for (let v of data.valoresHorariosGeneracion) {
            //ignore time saving codes
            if (v.ts.indexOf('A') + v.ts.indexOf('B') > 0) {
                continue
            }
            const res = await db.run(ingest.instant, [v.ts, v.solFot, v.eol, v.solTer, v.hid, v.nuc, v.cogenResto, v.cc, v.car, v.inter, v.termRenov])
            if (res.lastId>0) {
                updatedRowsCount++
            }
        }
        logger.info(`Updated ${updatedRowsCount} rows. Last ID: ${res.lastID}`)
    } catch (e) {

        logger.error(`Error when updating instant data ${e}`)
        logger.error(e.stack)
    }
}

const readingMappings = {
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
}

const installedIngestionMapping = {
    'Wind': 'Wind',
    'Hydro': 'Hydro',
    'Solar photovoltaic': 'Solar',
    'Pumped storage': 'Pumped',
    'Thermal solar': 'Thermalsolar',
    'Coal': 'Carbon',
    'Nuclear': 'Nuclear',
}

export async function ingestYearlyInstalled(db) {
    const startDate = format(subDays(new Date(), 365*3), 'yyyy-01-01')
    const endDate = format(new Date(), 'yyyy-MM-dd')
    const reqUrl = getInstalledUrl(startDate, endDate, 'year')
    try {
        const res = await axios.get(reqUrl, axiosOptions)
        const energies = res.data.included.filter(e => installedIngestionMapping[e.type])
        energies.forEach(async energy => {
            energy.attributes.values.forEach(async value => {
                const installed = value.value
                if (!installed) return
                const dayDate = value.datetime.substring(0, 4)
                const statement = ingest.yearlyInstalled(installedIngestionMapping[energy.type])
                await db.run(statement, [dayDate, installed])
            })
        })
    } catch (e) {
        console.error(e)
    }
}

export async function ingestMonthlyInstalled(db) {
    const startDate = format(subDays(new Date(), 30*22), 'yyyy-MM-01')
    const endDate = format(new Date(), 'yyyy-MM-dd')
    const reqUrl = getInstalledUrl(startDate, endDate, 'month')
    try {
        const res = await axios.get(reqUrl, axiosOptions)
        const energies = res.data.included.filter(e => installedIngestionMapping[e.type])
        energies.forEach(async energy => {
            energy.attributes.values.forEach(async value => {
                const installed = value.value
                if (!installed) return
                const monthDate = value.datetime.substring(0, 7)
                const statement = ingest.monthlyInstalled(installedIngestionMapping[energy.type])
                await db.run(statement, [monthDate, installed])
            })
        })
    } catch (e) {
        console.error(e)
    }
}

export async function ingestDailyBalance(db) {
    const startDate = format(subDays(new Date(), 30), 'yyyy-MM-dd')
    const endDate = format(subDays(new Date(), 1), 'yyyy-MM-dd')
    await ingestBalanceForCountryAndType(db, startDate, endDate, 'francia', 'day', 10, ingest.dailyBalance('France'))
    await ingestBalanceForCountryAndType(db, startDate, endDate, 'marruecos', 'day', 10, ingest.dailyBalance('Morocco'))
    await ingestBalanceForCountryAndType(db, startDate, endDate, 'portugal', 'day', 10, ingest.dailyBalance('Portugal'))
}

export async function ingestMonthlyBalance(db) {
    const startDate = format(subDays(new Date(), 30*22), 'yyyy-MM-01')
    const endDate = format(new Date(), 'yyyy-MM-dd')
    await ingestBalanceForCountryAndType(db, startDate, endDate, 'francia', 'month', 7, ingest.monthlyBalance('France'))
    await ingestBalanceForCountryAndType(db, startDate, endDate, 'marruecos', 'month', 7, ingest.monthlyBalance('Morocco'))
    await ingestBalanceForCountryAndType(db, startDate, endDate, 'portugal', 'month', 7, ingest.monthlyBalance('Portugal'))
}

export async function ingestYearlyBalance(db) {
    const startDate = '2017-01-01'//format(subDays(new Date(), 365*11), 'yyyy-01-01')
    const endDate = '2018-12-31'
    //const endDate = format(subDays(new Date(), 1), 'yyyy-MM-dd')
    await ingestBalanceForCountryAndType(db, startDate, endDate, 'francia', 'year', 4, ingest.yearlyBalance('France'))
    await ingestBalanceForCountryAndType(db, startDate, endDate, 'marruecos', 'year', 4, ingest.yearlyBalance('Morocco'))
    await ingestBalanceForCountryAndType(db, startDate, endDate, 'portugal', 'year', 4, ingest.yearlyBalance('Portugal'))
}

export async function ingestDailyEmissions(db) {
    const startDate = format(subDays(new Date(), 90), 'yyyy-MM-dd')
    const endDate = format(subDays(new Date(), 1), 'yyyy-MM-dd')
    ingestEmissionsForType(db, startDate, endDate, 'day', 10, ingest.dailyEmissions)
}

export async function ingestMonthlyEmissions(db) {
    const startDate = format(subDays(new Date(), 30*22), 'yyyy-MM-01')
    const endDate = format(new Date(), 'yyyy-MM-dd')
    ingestEmissionsForType(db, startDate, endDate, 'month', 7, ingest.monthlyEmissions)
}

export async function ingestYearlyEmissions(db) {
    const startDate = format(subDays(new Date(), 365*3), 'yyyy-01-01')
    //const endDate = format(subDays(new Date(), 365*12), 'yyyy-12-31')
    const endDate = format(new Date(), 'yyyy-MM-dd')
    ingestEmissionsForType(db, startDate, endDate, 'year', 4, ingest.yearlyEmissions)
}

async function ingestBalanceForCountryAndType(db, startDate, endDate, country, type, dateTruncLength, sqlStatement) {
    const reqUrl = getBalanceUrl(startDate, endDate, type, country)
    try {
        const res = await axios.get(reqUrl, axiosOptions)
        const values = res.data.included.find(a => a.type === 'saldo').attributes.values
        values.forEach(async value => {
            const balance = value.value
            if (!balance) return
            const dayDate = value.datetime.substring(0, dateTruncLength)
            await db.run(sqlStatement, [dayDate, balance])
        })
    } catch (e) {
        console.error(e)
    }
}

async function ingestEmissionsForType(db, startDate, endDate, type, dateTruncLength, sqlStatement) {
    const reqUrl = getEmisionesUrl(startDate, endDate, type)
    try {
        const res = await axios.get(reqUrl, axiosOptions)
        const filteredRes = res.data.included.filter(d => d.type === 'tCO2 eq./MWh')
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
                const res = await db.run(sqlStatement, [dayDate, emissions])
                logger.info(`Updated ${type} emissions for ${dayDate} with value ${emissions}`)
            }
        }
    } catch(e) {
        logger.error(`Error updating daily emissions ${e}`)
        logger.error(e.stack)
    }
}

export async function ingestDaily(db) {
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
            const res = await db.run(ingest.daily, [date, readings.solarpv, readings.wind, readings.solarthermal, readings.hydro, readings.nuclear, readings.cogen, readings.gas, readings.coal])
            logger.info(`last id of values inserted for day ${date}: ${res.lastID}`)
        }
        return values
    } catch(e) { 
        logger.error(`Error updating daily data ${e}`)
        logger.error(e.stack)
        return { error: true, message: `${e}` }
    }
}

export async function ingestHourlyPvpc(db) {
    const startDate = format(subDays(new Date(), 7), 'yyyy-MM-dd')
    const endDate = format(addDays(new Date(), 2), 'yyyy-MM-dd')
    const reqUrl = getPvpcUrl(startDate, endDate, 'hour')
    logger.info(`Ingesting hourly from ${reqUrl}`)

    try {
        const res = await axios.get(reqUrl, axiosOptions)
        const values = valuesToDates(res, 'yyyy-MM-dd HH')
        logger.info(`Values received have a length of ${values.length}`)

        for (const hour in values) {
            const readings = values[hour]
            const res = await db.run(ingest.hourlyPvpc, [hour, readings.pvpc])
            logger.info(`last id of values inserted ${res.lastID}`)
        }
        return values
    } catch(e) { 
        const message = `Error updating hourly pvpc data ${e}`
        logger.error(message)
        return { error: true, message }
    }
}


export async function ingestMonthly(db) {
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
            const res = await db.run(ingest.monthly, columnValues)
            logger.info(res.lastID)
        }
        return values
    } catch(e) { 
        const message =`Error updating monthly data ${e}`
        logger.error(message)
        return { error: true, message }
    }
}

export async function ingestYearly(db) {
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
            const res = await db.run(ingest.year, [date, readings.solarpv, readings.wind, readings.solarthermal, readings.hydro, readings.nuclear, readings.cogen, readings.gas, readings.coal])
            logger.info(res.lastID)
        }
    } catch(e) { 
        const message = `Error updating yearly data ${e}`
        logger.error(message)
        return { error: true, message }
    }
}

// map of arguments to functions
const argMapToFunctions = {
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

open({
    filename: DB_FILE,
    driver: sqlite3.verbose().Database
}).then(async db => {
    try {
        if (argMapToFunctions[args.data]) {
            for (const func of argMapToFunctions[args.data]) {
                await func(db)
                logger.info('Processed ' + func.name)
            }
        } else {
            logger.info(`${args.data} data type not recognised`)
        }
    } catch(e) {
        logger.info(e.response || e)
    }
    
})
