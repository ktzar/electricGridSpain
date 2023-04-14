
export const select = {
    instantLatest: count => `select * from instant order by time desc limit 0,${count}`,
    instantLatestByDay: day => `select * from instant where time like '${day}%' order by time desc limit 0,144`,
    dailyLatest: count => `select * from daily order by day desc limit 0,${count}`,
    monthlyLatest: count => `select * from monthly order by month desc limit 0,${count}`,
    yearlyLatest:  count => `select * from yearly order by year desc limit 0,${count}`
}

const commonCols = 'solarpv, wind, solarthermal, hidro, nuclear, cogen, gas, carbon'
const updateOnConflict = 'update set solarpv=excluded.solarpv, wind=excluded.wind, solarthermal=excluded.solarthermal, nuclear=excluded.nuclear, hidro=excluded.hidro, cogen=excluded.cogen, gas=excluded.gas, carbon=excluded.carbon'

export const ingest = {
        instant: 'insert or replace into instant (time, ' + commonCols + ', inter, thermal) values(?,?,?,?,?,?,?,?,?,?,?);',
        daily: 'insert into daily (day, ' + commonCols + ') values(?,?,?,?,?,?,?,?,?) on conflict(day) do ' + updateOnConflict + ';',
        monthly: 'insert or replace into monthly (month, ' + commonCols + ') values(?,?,?,?,?,?,?,?,?);',
        year: 'insert or replace into yearly (year, ' + commonCols + ') values(?,?,?,?,?,?,?,?,?);',
        dailyEmissions: 'insert into daily (day, emissions) values(?,?) on conflict(day) do update set emissions=excluded.emissions;',
        monthlyEmissions: 'insert into monthly (month, emissions) values(?,?) on conflict(month) do update set emissions=excluded.emissions;',
        yearlyEmissions: 'insert into yearly (year, emissions) values(?,?) on conflict(year) do update set emissions=excluded.emissions;',
        monthlyInstalledSolar: 'insert or replace into monthly (month, installedSolar) values(?,?) on conflict(month) do update set installedSolar=excluded.installedSolar;',
        monthlyInstalledWind: 'insert or replace into monthly (month, installedWind) values(?,?) on conflict(month) do update set installedWind=excluded.installedWind;',
        yearlyInstalledSolar: 'insert or replace into yearly (year, installedSolar) values(?,?) on conflict(year) do update set installedSolar=excluded.installedSolar;',
        yearlyInstalledWind: 'insert or replace into yearly (year, installedWind) values(?,?) on conflict(year) do update set installedWind=excluded.installedWind;',
        dailyBalance: country => `insert into daily (day, balance${country}) values(?,?) on conflict(day) do update set balance${country}=excluded.balance${country};`,
        monthlyBalance: country => `insert into monthly (month, balance${country}) values(?,?) on conflict(month) do update set balance${country}=excluded.balance${country};`,
        yearlyBalance: country => `insert into yearly (year, balance${country}) values(?,?) on conflict(year) do update set balance${country}=excluded.balance${country};`,
}

/**
export const weekly = ```
with temp as (
      select
        daily.*,
        (row_number() over (order by day desc) / 7) as grp
      from daily
)
select
  min(day) as week_starting_on_day,
  round(sum(solarpv)) as solarpv,
  round(sum(wind)) as wind,
  round(sum(solarthermal)) as solarthermal,
  round(sum(nuclear)) as nuclear,
  round(sum(hidro)) as hidro,
  round(sum(cogen)) as cogen,
  round(sum(gas)) as gas,
  round(sum(carbon)) as carbon
from temp
group by grp
```
**/
