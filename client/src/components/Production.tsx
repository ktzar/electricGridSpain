import { Colour, colours } from '../shared/colours'
import { EnergyType } from '../shared/types'
import { Line } from 'react-chartjs-2';
import { useQuery } from 'react-query'
import { queryOptions } from '../shared/queryOptions';
import { sortByField, FieldEntity } from '../shared/fields';
import { fetchDaily, fetchInstantByDay, fetchMonthly, fetchYearly, fetchOneYearAgoInstant } from '../shared/requests';
import dayjs from 'dayjs';
import { useState } from 'react';
import { chartOptions } from '../shared/chartOptions';
import { Button } from './Button';
import InfoIconTooltip from './InfoIconTooltip';

const dateFormat = 'YYYY-MM-DD'

const getScaleFromData = (data1 : any, data2 : any) => {
    let maxValue = -99999
    let minValue = 99999
    if (!data1 || !data2) return [ minValue, maxValue ]
    for (let i = 0; i < data1.length; i++) {
        const d = data1[i]
        const keys = Object.keys(d)
        for (let j = 0; j < keys.length; j++) {
            const k = parseInt(d[keys[j]])
            if (k > maxValue) {
                maxValue = k
            }
            if (k < minValue) {
                minValue = k
            }
        }
    }
    for (let i = 0; i < data2.length; i++) {
        const d = data2[i]
        const keys = Object.keys(d)
        for (let j = 0; j < keys.length; j++) {
            const k = parseInt(keys[j])
            if (k > maxValue) {
                maxValue = k
            }
            if (k < minValue) {
                minValue = k
            }
        }
    }

    return [ minValue, maxValue ]
}

const labelToDataset = (data : Record<string, any>, scaleDown = 1) => (label : EnergyType) => (
    {
        label,
        data: data.map((k : any) => k[label] / scaleDown),
        borderColor: colours[label],
        tension: 0.3,
        borderWidth: 1.5
    }
)

export default () => {
    //today date in format yyyy-mm-dd
    const today = new Date().toISOString().slice(0, 10);
    const [instantDay, setInstantDay] = useState<string>('')
    const [instantDayInput, setInstantDayInput] = useState<string>('')

    const { isLoading: isLoadingInstantDate, data: latestDataByDay } = useQuery('latestDataByDay' + instantDay, () => {
        if (instantDay === '') return Promise.resolve([])
        return fetchInstantByDay(instantDay).then(d => d.sort(sortByField('time')))
    }, queryOptions)


    const { isLoading, error, data: latestData } = useQuery('latestData', () => {
        return fetch('/api/latest').then(res => res.json()).then(d => d.sort(sortByField('time')))
    }, queryOptions)

    const { isLoading: isLoadingLastYear, data: lastYearWeekData } = useQuery('oneYearAgoInstant', fetchOneYearAgoInstant, queryOptions)

    const { isLoading: isLoadingDaily, data: dailyData } = useQuery('daily', fetchDaily, queryOptions)
    const { isLoading: isLoadingMonthly, data: monthlyData } = useQuery('monthly', fetchMonthly, queryOptions)
    const { isLoading: isLoadingYearly, data: yearlyData } = useQuery('yearly', fetchYearly, queryOptions)

    if (isLoading || isLoadingMonthly || isLoadingDaily || isLoadingYearly || isLoadingLastYear) {
        return <div className="spinner-border" role="status">
           <span className="sr-only"></span>
       </div>
    }

    const instantDateParsed = dayjs(instantDay)
    const clearLabels = Object.keys(latestData[0]).filter(k => k !== 'time')
    const [minValue, maxValue] = getScaleFromData(latestData, latestDataByDay)
    const yesterdayDate = dayjs().subtract(1, 'day').format(dateFormat)
    const lastWeekDate = dayjs().subtract(7, 'day').format(dateFormat)
    const lastYearDate = dayjs().subtract(1, 'year').format(dateFormat)
    const previousDayDate = instantDateParsed.subtract(1, 'day').format(dateFormat)
    const nextDayDate = instantDateParsed.add(1, 'day').format(dateFormat)

    return (
        <>
        <div className="card mt-2">
          <div className="card-header">
            How has electricity been produced
            </div>
          <div className="card-body">
            <div className="row">
                <div className="col-sm-4">
                    <h5 className="text-center">Last {Math.round(latestData.length / 6).toString()} hours</h5>
                    <Line options={chartOptions({title: 'Instant production', max: maxValue, min: minValue})} data={{
                        labels: latestData.map((k : FieldEntity) => k.time),
                        datasets: clearLabels.map(labelToDataset(latestData))
                    }}/>
                </div>
                <div className="col-sm-4">
                    <h5 className="text-center">Weekly avg last year <span style={{fontWeight: 'normal', textTransform: 'none'}}><InfoIconTooltip text="Average of each instant value for a full week a year ago" /></span></h5>
                    <Line options={chartOptions({title: 'Instant production', max: maxValue, min: minValue})} data={{
                        labels: lastYearWeekData.map((k : FieldEntity) => k.time),
                        datasets: clearLabels.map(labelToDataset(lastYearWeekData))
                    }}/>
                </div>
                <div className="col-sm-4 text-center">
                    {!isLoadingInstantDate &&
                        <>
                            <h5>{instantDay === '' ? 'Production for a given day' : 'Production for ' + dayjs(instantDay).format('DD/MMM/YY')}</h5>
                            {instantDay !== '' && (
                                <Line options={chartOptions({title: `Instant production for ${instantDay}`, max: maxValue, min: minValue})} data={{
                                    labels: latestDataByDay.map((k : FieldEntity) => k.time),
                                    datasets: clearLabels.map(labelToDataset(latestDataByDay))
                                }}/>
                            )}
                            {(latestDataByDay.length === 0 && instantDay !== '') && <div className="badge badge-pill badge-danger">No data for this day</div>}
                            <input type="date" id="start" name="trip-start"
                                onChange={val => setInstantDayInput(val.target.value)}
                                style={{fontSize: '12px'}}
                                value={instantDayInput || instantDay}
                                min="2015-01-01" max={today}></input>
                            <Button onClick={() => setInstantDay(instantDayInput)}>Load</Button>
                            <br/>
                            {instantDay === '' ? (<>
                                <Button onClick={() => setInstantDay(yesterdayDate)}>Yesterday</Button>
                                <Button onClick={() => setInstantDay(lastWeekDate)}>7 days ago</Button>
                                <Button onClick={() => setInstantDay(lastYearDate)}>1 year ago</Button>
                                </>
                            ) : (
                                <>
                                <Button onClick={() => setInstantDay(previousDayDate)}>&lt; Previous day</Button>
                                {instantDay != today &&(<Button onClick={() => setInstantDay(today)}>Today</Button>)}
                                <Button onClick={() => setInstantDay(nextDayDate)}>Next day &gt;</Button>
                                </>
                            )}
                        </>
                    }
                </div>
            </div>
            <div className="row">
                <div className="col-sm-4">
                    <h5 className="text-center">Last {dailyData.length} days</h5>
                    <Line options={chartOptions()} data={{
                        labels: dailyData.map((k : FieldEntity) => k.day),
                        datasets: clearLabels.map(labelToDataset(dailyData, 24))
                    }}/>
                </div>
                <div className="col-sm-4">
                    <h5 className="text-center">Last {monthlyData.length} months</h5>
                    <Line options={chartOptions()} data={{
                        labels: monthlyData.map((k : FieldEntity) => k.month),
                        datasets: clearLabels.map(labelToDataset(monthlyData, 24*30))
                    }}/>
                </div>
                <div className="col-sm-4">
                    <h5 className="text-center">Last {yearlyData.length} years</h5>
                    <Line options={chartOptions()} data={{
                        labels: yearlyData.map((k : FieldEntity) => k.year),
                        datasets: clearLabels.map(labelToDataset(yearlyData, 24*365))
                    }}/>
                </div>
            </div>
          </div>
        </div>
        </>
    );
}
