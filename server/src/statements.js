
const commonCols = 'solarpv, wind, solarthermal, hidro, nuclear, cogen, gas, carbon, thermal'
const colToRoundedAvg = col => `round(avg(${col}), 2) AS ${col}`;
export const select = {
    instantLatest: count => `select * from instant order by time desc limit 0,${count}`,
    instantLatestByDay: day => `select * from instant where time like '${day}%' order by time desc limit 0,144`,
    instantLatest24h: day => `select * from instant where time > date('now', '-1 day') || ' ' || time('now', '-1 day') order by time desc`,
    instantOneMonthFrom: (when = '-1 year') => `WITH inst AS (SELECT time AS xtime, ${commonCols}, inter FROM instant)
    SELECT substr(xtime, 12, 7) AS time,
        ${commonCols.split(',').map(colToRoundedAvg).join(',')}
    FROM inst
    WHERE
      xtime > date('now','${when}') AND
      xtime < date('now', '${when}', '+30 days')
    GROUP BY time
    ORDER BY xtime asc;
  `,
    dailyLatest: count => `select * from daily order by day desc limit 0,${count}`,
    monthlyLatest: count => `select * from monthly order by month desc limit 0,${count}`,
    yearlyLatest:  count => `select * from yearly order by year desc limit 0,${count}`,
    hourlyLatest: count => `select * from hourly order by hour desc limit 0,${count}`,
    instantLatestByDay: (from, to) => `select time(time),
      avg(solarpv) as solarpv,
      avg(wind) as wind,
      avg(hidro) as hidro,
      avg(carbon) as carbon,
      avg(nuclear) as nuclear,
      avg(gas) as gas
    from instant where time > '${from}' and time < '${to}' group by time(time)`,
}

const updateOnConflict = 'update set solarpv=excluded.solarpv, thermal=excluded.thermal, wind=excluded.wind, solarthermal=excluded.solarthermal, nuclear=excluded.nuclear, hidro=excluded.hidro, cogen=excluded.cogen, gas=excluded.gas, carbon=excluded.carbon'

export const ingest = {
        instant: 'insert or replace into instant (time, ' + commonCols + ', inter, thermal) values(?,?,?,?,?,?,?,?,?,?,?);',
        daily: 'insert into daily (day, ' + commonCols + ') values(?,?,?,?,?,?,?,?,?) on conflict(day) do ' + updateOnConflict + ';',
        monthly: 'insert or replace into monthly (month, ' + commonCols + ') values(?,?,?,?,?,?,?,?,?);',
        year: 'insert or replace into yearly (year, ' + commonCols + ') values(?,?,?,?,?,?,?,?,?);',
        dailyEmissions: 'insert into daily (day, emissions) values(?,?) on conflict(day) do update set emissions=excluded.emissions;',
        monthlyEmissions: 'insert into monthly (month, emissions) values(?,?) on conflict(month) do update set emissions=excluded.emissions;',
        yearlyEmissions: 'insert into yearly (year, emissions) values(?,?) on conflict(year) do update set emissions=excluded.emissions;',
        yearlyInstalled: energy => `insert into yearly (year, installed${energy}) values(?,?) on conflict(year) do update set installed${energy}=excluded.installed${energy};`,
        monthlyInstalled: energy => `insert into monthly (month, installed${energy}) values(?,?) on conflict(month) do update set installed${energy}=excluded.installed${energy};`,
        dailyBalance: country => `insert into daily (day, balance${country}) values(?,?) on conflict(day) do update set balance${country}=excluded.balance${country};`,
        monthlyBalance: country => `insert into monthly (month, balance${country}) values(?,?) on conflict(month) do update set balance${country}=excluded.balance${country};`,
        yearlyBalance: country => `insert into yearly (year, balance${country}) values(?,?) on conflict(year) do update set balance${country}=excluded.balance${country};`,
        hourlyPvpc: 'insert into hourly (hour, pvpc) values(?,?) on conflict(hour) do update set pvpc=excluded.pvpc;',
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
