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

const getGeneracionUrl = (startDate, endDate, trunc) =>
    'https://apidatos.ree.es/en/datos/generacion/estructura-generacion?start_date={startDate}&end_date={endDate}&time_trunc={trunc}'
        .replace('{startDate}', startDate)
        .replace('{endDate}', endDate)
        .replace('{trunc}', trunc)

const getEmisionesUrl = (startDate, endDate, trunc) =>
    'https://apidatos.ree.es/en/datos/generacion/no-renovables-detalle-emisiones-CO2?start_date={startDate}&end_date={endDate}&time_trunc={trunc}'
        .replace('{startDate}', startDate)
        .replace('{endDate}', endDate)
        .replace('{trunc}', trunc)

const getDemandaUrl = date =>
    'https://demanda.ree.es/WSvisionaMovilesPeninsulaRest/resources/demandaGeneracionPeninsula?callback=callback&fecha={date}'
        .replace('{date}', date)

export async function ingestInstant(db) {
    try {
        const date = format(new Date(), 'yyyy-MM-dd')
        const reqUrl = getDemandaUrl(date)
        logger.info(`Requesting ${reqUrl}`)

        const res = await axios.get(reqUrl, axiosOptions)
        const data = parseJsonp('callback', res.data)
        logger.info(`Number of values ingested ${data.valoresHorariosGeneracion.length}`)

        let updatedRowsCount = 0
        for (let v of data.valoresHorariosGeneracion) {
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
}

export async function ingestDailyEmissions(db) {
    const startDate = format(subDays(new Date(), 90), 'yyyy-MM-dd')
    const endDate = format(subDays(new Date(), 1), 'yyyy-MM-dd')
    ingestEmissionsForType(db, startDate, endDate, 'day', 10, ingest.dailyEmissions)
}

export async function ingestMonthlyEmissions(db) {
    const startDate = format(subDays(new Date(), 30*24), 'yyyy-MM-01')
    const endDate = format(new Date(), 'yyyy-MM-dd')
    ingestEmissionsForType(db, startDate, endDate, 'month', 7, ingest.monthlyEmissions)
}

export async function ingestYearlyEmissions(db) {
    const startDate = format(subDays(new Date(), 365*16), 'yyyy-01-01')
    const endDate = format(subDays(new Date(), 365*12), 'yyyy-12-31')
    //const endDate = format(new Date(), 'yyyy-MM-dd')
    ingestEmissionsForType(db, startDate, endDate, 'year', 4, ingest.yearlyEmissions)
}

async function ingestEmissionsForType(db, startDate, endDate, type, dateTruncLength, sqlStatement) {
    const reqUrl = getEmisionesUrl(startDate, endDate, type)
    console.log(reqUrl)
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


export async function ingestHourly(db) {
    const startDate = format(subDays(new Date(), 5), 'yyyy-MM-dd')
    const endDate = format(new Date(), 'yyyy-MM-dd')
    const reqUrl = getGeneracionUrl(startDate, endDate, 'hour')
    logger.info(`Ingesting hourly from ${reqUrl}`)

    try {
        const res = await axios.get(reqUrl, axiosOptions)
        const values = valuesToDates(res, 'yyyy-MM-HH')
        logger.info(`Values received have a length of ${values}`)

        for (const date in values) {
            const readings = values[date]
            const res = await db.run(ingest.hourly, [date, readings.solarpv, readings.wind, readings.solarthermal, readings.hydro, readings.nuclear, readings.cogen, readings.gas, readings.coal])
            logger.info(`last id of values inserted ${res.lastID}`)
        }
        return values
    } catch(e) { 
        const message = `Error updating monthly data ${e}`
        logger.error(message)
        return { error: true, message }
    }
}

export async function ingestMonthly(db) {
    const startDate = format(subDays(new Date(), 30*23), 'yyyy-MM-01')
    const endDate = format(subDays(new Date(), 30*0), 'yyyy-MM-dd')
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

open({
    filename: DB_FILE,
    driver: sqlite3.verbose().Database
}).then(async db => {

    try {
        if (args.data === 'all') {
            await ingestInstant(db)
            await ingestDaily(db)
            await ingestMonthly(db)
            await ingestYearly(db)
            logger.info('All ingested')
        }else if (args.data === 'instant') {
            await ingestInstant(db)
            logger.info('Instant ingested')
        } else if(args.data === 'dailyEmissions') {
            await ingestDailyEmissions(db)
            logger.info('Daily emissions ingested')
        } else if(args.data === 'monthlyEmissions') {
            await ingestMonthlyEmissions(db)
            logger.info('Monthly emissions ingested')
        } else if(args.data === 'yearlyEmissions') {
            await ingestYearlyEmissions(db)
            logger.info('Yearly ingested')
        } else if(args.data === 'daily') {
            await ingestDaily(db)
            logger.info('Daily ingested')
        } else if(args.data === 'hourly') {
            await ingestHourly(db)
            logger.info('Hourly ingested')
        } else if(args.data === 'monthly') {
            await ingestMonthly(db)
            logger.info('Monthly ingested')
        } else if(args.data === 'yearly') {
            await ingestYearly(db)
            logger.info('Yearly ingested')
        } else {
            logger.info(`${args.data} data type not recognised`)
        }
    } catch(e) {
        logger.info(e.response || e)
    }
    
})
