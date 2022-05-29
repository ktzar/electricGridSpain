const sqlite3 = require('sqlite3')
const args = require('args-parser')(process.argv)
const { parseISO, format, subDays, addDays } = require('date-fns')
const {open} = require('sqlite')
const parseJsonp = require('parse-jsonp')
const axios = require('axios')

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
    'https://demanda.ree.es/WSvisionaMovilesPeninsulaRest/resources/demandaGeneracionPeninsula?callback=callback&curva=DEMANDA&fecha={date}'
        .replace('{date}', date)

const statements = {
    instant: 'insert into instant (time, solarpv, wind, solarthermal, nuclear, hidro, inter, thermal, cogen, gas, carbon) values(?,?,?,?,?,?,?,?,?,?,?) on conflict(time) do update set solarpv=excluded.solarpv, wind=excluded.wind, solarthermal=excluded.solarthermal, nuclear=excluded.nuclear, hidro=excluded.hidro, inter=excluded.inter, thermal=excluded.thermal, cogen=excluded.cogen, gas=excluded.gas, carbon=excluded.carbon;',
    daily: 'insert into daily (day, solarpv, wind, solarthermal, nuclear, hidro, cogen, gas, carbon) values(?,?,?,?,?,?,?,?,?) on conflict(day) do update set solarpv=excluded.solarpv, wind=excluded.wind, solarthermal=excluded.solarthermal, nuclear=excluded.nuclear, hidro=excluded.hidro, cogen=excluded.cogen, gas=excluded.gas, carbon=excluded.carbon;',
    monthly: 'insert into monthly (month, solarpv, wind, solarthermal, nuclear, hidro, cogen, gas, carbon) values(?,?,?,?,?,?,?,?,?) on conflict(month) do update set solarpv=excluded.solarpv, wind=excluded.wind, solarthermal=excluded.solarthermal, nuclear=excluded.nuclear, hidro=excluded.hidro, cogen=excluded.cogen, gas=excluded.gas, carbon=excluded.carbon;',
    year: 'insert into yearly (year, solarpv, wind, solarthermal, nuclear, hidro, cogen, gas, carbon) values(?,?,?,?,?,?,?,?,?) on conflict(year) do update set solarpv=excluded.solarpv, wind=excluded.wind, solarthermal=excluded.solarthermal, nuclear=excluded.nuclear, hidro=excluded.hidro, cogen=excluded.cogen, gas=excluded.gas, carbon=excluded.carbon;'
}

async function ingestInstant(db) {
    try {
        const date = format(new Date(), 'yyyy-MM-dd')
        console.log(date)
        const reqUrl = getDemandaUrl(date)

        const res = await axios.get(reqUrl)
        const data = parseJsonp('callback', res.data)

        let updatedRowsCount = 0
        for (let v of data.valoresHorariosGeneracion) {
            const res = await db.run(statements.instant, [v.ts, v.solFot, v.eol, v.solTer, v.nuc, v.hid, v.inter, v.termRenov, v.cogenResto, v.cc, v.car])
            if (res.lastId>0) {
                updatedRowsCount++
            }
        }
        console.log(`Updated ${updatedRowsCount} rows. Last ID: ${res.lastID}`)
    } catch (e) {
        console.error(`Error when updating instant data ${e}`)
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

async function ingestDaily(db) {
    const startDate = format(subDays(new Date(), 30), 'yyyy-MM-dd')
    const endDate = format(new Date(), 'yyyy-MM-dd')
    const reqUrl = getGeneracionUrl(startDate, endDate, 'day')
    console.log({reqUrl})

    try {
        const res = await axios.get(reqUrl)
        const values = valuesToDates(res, 'yyyy-MM-dd')
        console.log(values)

        for (const date in values) {
            const readings = values[date]
            const res = await db.run(statements.daily, [date, readings.solarpv, readings.wind, readings.solarthermal, readings.nuclear, readings.hydro, readings.cogen, readings.gas, readings.coal])
            console.log(res.lastID)
        }
    } catch(e) { 
        console.error(`Error updating daily data ${e}`)
    }
}

async function ingestMonthly(db) {
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
            const res = await db.run(statements.monthly, [date, readings.solarpv, readings.wind, readings.solarthermal, readings.nuclear, readings.hydro, readings.cogen, readings.gas, readings.coal])
            console.log(res.lastID)
        }
    } catch(e) { 
        console.error(`Error updating monthly data ${e}`)
    }
}

async function ingestYearly(db) {
    const startDate = '2021-01-01'
    const endDate = '2021-12-31'
    //const startDate = format(subDays(new Date(), 365*2), 'yyyy-MM-dd')
    //const endDate = format(subDays(new Date(), 365*4), 'yyyy-MM-dd')
    const reqUrl = getGeneracionUrl(startDate, endDate, 'year')
    console.log({reqUrl})

    try {
        const res = await axios.get(reqUrl)
        const values = valuesToDates(res, 'yyyy', 1)
        console.log(values)

        for (const date in values) {
            const readings = values[date]
            const res = await db.run(statements.year, [date, readings.solarpv, readings.wind, readings.solarthermal, readings.nuclear, readings.hydro, readings.cogen, readings.gas, readings.coal])
            console.log(res.lastID)
        }
    } catch(e) { 
        console.error(`Error updating yearly data ${e}`)
    }
}

open({
    filename: './database.db',
    driver: sqlite3.Database
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

module.exports = {
   ingestInstant
}
