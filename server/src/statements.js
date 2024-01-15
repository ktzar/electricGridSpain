
export const select = {
    instantLatest: count => `select * from instant order by time desc limit 0,${count}`,
    instantLatestByDay: day => `select * from instant where time like '${day}%' order by time desc limit 0,144`,
    instantOneYearAgo: () => `WITH inst AS (SELECT time AS xtime, solarpv, wind, solarthermal, nuclear, hidro, inter, thermal, cogen, gas, carbon FROM instant)
    SELECT substr(xtime, 12, 7) AS time,
        round(avg(solarpv), 2) AS solarpv,
        round(avg(wind), 2) AS wind,
        round(avg(solarpv), 2) AS solarpv,
        round(avg(wind), 2) AS wind,
        round(avg(solarthermal), 2) AS solarthermal,
        round(avg(nuclear), 2) AS nuclear,
        round(avg(hidro), 2) AS hidro,
        round(avg(inter), 2) AS inter,
        round(avg(thermal), 2) AS thermal,
        round(avg(cogen), 2) AS cogen,
        round(avg(gas), 2) AS gas,
        round(avg(carbon), 2) AS carbon
    FROM inst
    WHERE
      xtime > date('now','-1 year') AND
      xtime < date('now', '-1 year', '+30 days')
    GROUP BY time
    ORDER BY xtime asc;
  `,
    dailyLatest: count => `select * from daily order by day desc limit 0,${count}`,
    monthlyLatest: count => `select * from monthly order by month desc limit 0,${count}`,
    yearlyLatest:  count => `select * from yearly order by year desc limit 0,${count}`,
    hourlyLatest: count => `select * from hourly order by hour desc limit 0,${count}`,
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
        yearlyInstalled: energy => `insert or replace into yearly (year, installed${energy}) values(?,?) on conflict(year) do update set installed${energy}=excluded.installed${energy};`,
        monthlyInstalled: energy => `insert or replace into monthly (month, installed${energy}) values(?,?) on conflict(month) do update set installed${energy}=excluded.installed${energy};`,
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
