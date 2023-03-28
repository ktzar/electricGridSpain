import { Colour, colours } from '../shared/colours'
import { EnergyType } from '../shared/types'
import { Line } from 'react-chartjs-2';
import { useQuery } from 'react-query'
import { queryOptions } from '../shared/queryOptions';
import { sortByField, FieldEntity } from '../shared/fields';
import { fetchDaily, fetchInstantByDay, fetchMonthly, fetchYearly } from '../shared/requests';
import { useState } from 'react';
import { chartOptions } from '../shared/chartOptions';

const getScaleFromData = (data1, data2) => {
    let maxValue = -99999
    let minValue = 99999
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

    const { isLoading: isLoadingDaily, data: dailyData } = useQuery('daily', fetchDaily, queryOptions)
    const { isLoading: isLoadingMonthly, data: monthlyData } = useQuery('monthly', fetchMonthly, queryOptions)
    const { isLoading: isLoadingYearly, data: yearlyData } = useQuery('yearly', fetchYearly, queryOptions)

    if (isLoading || isLoadingInstantDate || isLoadingMonthly || isLoadingDaily || isLoadingYearly) {
        return <div className="spinner-border" role="status">
           <span className="sr-only"></span>
       </div>
    }

    const clearLabels = Object.keys(latestData[0]).filter(k => k !== 'time')
    const [minValue, maxValue] = getScaleFromData(latestData, latestDataByDay)

    return (
        <>
        <div className="card mt-2">
          <div className="card-header">
            How has electricity been produced
            </div>
          <div className="card-body">
            <div className="row">
                <div className="col-sm-6">
                    <h5 className="text-center">Last {Math.round(latestData.length / 6).toString()} hours</h5>
                    <Line options={chartOptions({title: 'Instant production', max: maxValue, min: minValue})} data={{
                        labels: latestData.map((k : FieldEntity) => k.time),
                        datasets: clearLabels.map(labelToDataset(latestData))
                    }}/>
                </div>
                <div className="col-sm-6 text-center">
                    <h5>{instantDay === '' ? 'Production for a given day' : instantDay}</h5>
                    {instantDay !== '' && (
                        <Line options={chartOptions({title: `Instant production for ${instantDay}`, max: maxValue, min: minValue})} data={{
                            labels: latestDataByDay.map((k : FieldEntity) => k.time),
                            datasets: clearLabels.map(labelToDataset(latestDataByDay))
                        }}/>
                    )}
                    {(latestDataByDay.length === 0 && instantDay !== '') && <div className="badge badge-pill badge-danger">No data for this day</div>}
                    <h6>Choose another date</h6>
                    <input type="date" id="start" name="trip-start"
                        onChange={val => setInstantDayInput(val.target.value)}
                        value={instantDayInput}
                        min="2015-01-01" max={today}></input>
                    <button
                        className="btn btn-small btn-primary"
                        style={{margin: '0.5em', padding: '0.25em 0.5em'}}
                        onClick={() => setInstantDay(instantDayInput)}>
                            Load</button>

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
