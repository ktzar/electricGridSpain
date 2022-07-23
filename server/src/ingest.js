import sqlite3 from 'sqlite3'
import argsParser from 'args-parser'
import { parseISO, format, subDays, addDays } from 'date-fns'
import {open} from 'sqlite'
import parseJsonp from 'parse-jsonp'
import axios from 'axios'
import { ingest } from './statements.js'

const args = argsParser(process.argv)

function valuesToDates(res, dateFormat, extraDays = 0) {
    const values = {}
    for (let v of res.data.included) {
        const readingType = readingMappings[v.type]
        if (!readingType) {
            console.log('Unknown type ' + v.type)
            continue;
        }
        for (let reading of v.attributes.values) {
            const readingDate = format(addDays(parseISO(reading.datetime), extraDays), dateFormat)
            console.log({readingDate})
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

const getDemandaUrl = date =>
    'https://demanda.ree.es/WSvisionaMovilesPeninsulaRest/resources/demandaGeneracionPeninsula?callback=callback&fecha={date}'
        .replace('{date}', date)
export async function ingestInstant(db) {
    try {
        const date = format(new Date(), 'yyyy-MM-dd')
        const reqUrl = getDemandaUrl(date)
        console.log({reqUrl})

        const res = await axios.get(reqUrl)
        const data = parseJsonp('callback', res.data)

        let updatedRowsCount = 0
        for (let v of data.valoresHorariosGeneracion) {
            const res = await db.run(ingest.instant, [v.ts, v.solFot, v.eol, v.solTer, v.nuc, v.hid, v.cogenResto, v.cc, v.car, v.inter, v.termRenov])
            if (res.lastId>0) {
                updatedRowsCount++
            }
        }
        console.log(`Updated ${updatedRowsCount} rows. Last ID: ${res.lastID}`)
    } catch (e) {

        console.error(`Error when updating instant data ${e}`)
        console.error(e.stack)
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

export async function ingestDaily(db) {
    const startDate = format(subDays(new Date(), 25), 'yyyy-MM-dd')
    const endDate = format(new Date(), 'yyyy-MM-dd')
    const reqUrl = getGeneracionUrl(startDate, endDate, 'day')
    console.log({reqUrl})

    try {
        const res = await axios.get(reqUrl)
        const values = valuesToDates(res, 'yyyy-MM-dd')
        console.log(values)

        for (const date in values) {
            const readings = values[date]
            const res = await db.run(ingest.daily, [date, readings.solarpv, readings.wind, readings.solarthermal, readings.nuclear, readings.hydro, readings.cogen, readings.gas, readings.coal])
            console.log(res.lastID)
        }
    } catch(e) { 
        console.error(`Error updating daily data ${e}`)
        console.error(e.stack)
    }
}


export async function ingestHourly(db) {
    const startDate = format(subDays(new Date(), 5), 'yyyy-MM-dd')
    const endDate = format(new Date(), 'yyyy-MM-dd')
    const reqUrl = getGeneracionUrl(startDate, endDate, 'hour')
    console.log({reqUrl})

    try {
        const res = await axios.get(reqUrl)
        const values = valuesToDates(res, 'yyyy-MM-HH')
        console.log(values)

        for (const date in values) {
            const readings = values[date]
            const res = await db.run(ingest.hourly, [date, readings.solarpv, readings.wind, readings.solarthermal, readings.nuclear, readings.hydro, readings.cogen, readings.gas, readings.coal])
            console.log(res.lastID)
        }
    } catch(e) { 
        console.error(`Error updating monthly data ${e}`)
    }
}

export async function ingestMonthly(db) {
    const startDate = format(subDays(new Date(), 30*24), 'yyyy-MM-dd')
    const endDate = format(subDays(new Date(), 30*0), 'yyyy-MM-dd')
    const reqUrl = getGeneracionUrl(startDate, endDate, 'month')
    console.log({reqUrl})

    try {
        const res = await axios.get(reqUrl)
        const values = valuesToDates(res, 'yyyy-MM')
        console.log(values)

        for (const date in values) {
            const readings = values[date]
            const res = await db.run(ingest.monthly, [date, readings.solarpv, readings.wind, readings.solarthermal, readings.nuclear, readings.hydro, readings.cogen, readings.gas, readings.coal])
            console.log(res.lastID)
        }
    } catch(e) { 
        console.error(`Error updating monthly data ${e}`)
    }
}

export async function ingestYearly(db) {
    const startDate = '2016-01-01'//format(subDays(new Date(), 365*2), 'yyyy-MM-dd')
    const endDate = '2020-12-31'//format(new Date(), 'yyyy-MM-dd')
    const reqUrl = getGeneracionUrl(startDate, endDate, 'year')
    console.log({reqUrl})

    try {
        const res = await axios.get(reqUrl)
        const values = valuesToDates(res, 'yyyy', 1)
        console.log(values)

        for (const date in values) {
            const readings = values[date]
            const res = await db.run(ingest.year, [date, readings.solarpv, readings.wind, readings.solarthermal, readings.nuclear, readings.hydro, readings.cogen, readings.gas, readings.coal])
            console.log(res.lastID)
        }
    } catch(e) { 
        console.error(`Error updating yearly data ${e}`)
    }
}

open({
    filename: './database.db',
    driver: sqlite3.verbose().Database
}).then(async db => {

    try {
        if (args.data === 'all') {
            await ingestInstant(db)
            await ingestDaily(db)
            await ingestMonthly(db)
            await ingestYearly(db)
            console.log('All ingested')
        }else if (args.data === 'instant') {
            await ingestInstant(db)
            console.log('Instant ingested')
        } else if(args.data === 'daily') {
            await ingestDaily(db)
            console.log('Daily ingested')
        } else if(args.data === 'hourly') {
            await ingestHourly(db)
            console.log('Hourly ingested')
        } else if(args.data === 'monthly') {
            await ingestMonthly(db)
            console.log('Monthly ingested')
        } else if(args.data === 'yearly') {
            await ingestYearly(db)
            console.log('Yearly ingested')
        } else {
            console.log(args.data, 'not recognised')
        }
    } catch(e) {
        console.log(e.response || e)
    }
    
})
