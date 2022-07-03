
export const select = {
    instantLast: 'select * from instant order by time desc limit 0,1',
    instantLatest: 'select * from instant order by time desc limit 0,144',
    dailyLatest: 'select * from daily order by day desc limit 0,30',
    monthlyLatest: 'select * from monthly order by month desc limit 0,30',
    yearlyLatest: 'select * from yearly order by year desc limit 0,30'
}

const commonCols = 'solarpv, wind, solarthermal, nuclear, hidro, cogen, gas, carbon'
const updateOnConflict = 'update set solarpv=excluded.solarpv, wind=excluded.wind, solarthermal=excluded.solarthermal, nuclear=excluded.nuclear, hidro=excluded.hidro, cogen=excluded.cogen, gas=excluded.gas, carbon=excluded.carbon'

export const ingest = {
        instant: 'insert into instant (time, ' + commonCols + ', inter, thermal) values(?,?,?,?,?,?,?,?,?,?,?) on conflict(time) do ' + updateOnConflict
  + ', inter=excluded.inter, thermal=excluded.thermal;',
        daily: 'insert into daily (day, ' + commonCols + ') values(?,?,?,?,?,?,?,?,?) on conflict(day) do ' + updateOnConflict + ';',
        monthly: 'insert into monthly (month, ' + commonCols + ') values(?,?,?,?,?,?,?,?,?) on conflict(month) do ' + updateOnConflict + ';',
        year: 'insert into yearly (year, ' + commonCols + ') values(?,?,?,?,?,?,?,?,?) on conflict(year) do ' + updateOnConflict + ';'
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
