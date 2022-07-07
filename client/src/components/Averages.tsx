import { PieChart, Pie, Sector, Cell, ResponsiveContainer } from 'recharts';
import { useQuery } from 'react-query'
import { colours, EnergyType } from '../shared/colours'
import { Doughnut } from 'react-chartjs-2';
import { queryOptions } from '../shared/queryOptions';
import { sortByField } from '../shared/fields';

const doughOptions = {
    responsive: true,
    plugins: {
        legend: {
            display: false,
        },
        title: {
            display: true,
            text: 'Produced GWh'
        }
    }
}

type ListOfMeasurements = {name: EnergyType, value: number}[]

const dataToDoughnut = (data : ListOfMeasurements) => ({
    labels: data.map(k => k.name),
    datasets: [
        {
            label: 'GWh',
            data: data.map(k => k.value),
            backgroundColor: data.map(k => colours[k.name]),
        }
    ]
})

type MeasurementSet = Record<string, number>
const accumulateMeasurements = (measList : MeasurementSet[]) => 
    measList.reduce((meas, acc) => {
        for (let key in meas) {
            if (acc[key])
                acc[key] += meas[key]
            else
                acc[key] = meas[key]
        }
        return acc
    }, {})


const createKeyRemover = (key : string) => (obj : Record<string, any>) => {
    const tmp = {...obj}
    delete tmp[key]
    return tmp
}

const prepareSeriesForDoughnut = (series : MeasurementSet[], timeField : string) => {
    const recentValues = accumulateMeasurements(series.map(createKeyRemover(timeField)))
    return dataToDoughnut(Object.keys(recentValues)
        .map(key => ({name: key, value: recentValues[key]}))
        .filter(val => val.value > 0))
}


export default () => {
    const { isLoading: isLoadingInstant, data: latestData } = useQuery('latestData', () => {
        return fetch('/api/latest').then(res => res.json()).then(d => d.sort(sortByField('time')))
    }, queryOptions)
    const { isLoading: isLoadingDaily, data: dailyData } = useQuery('daily', () =>
        fetch('/api/daily').then(res => res.json())
    , queryOptions)
    const { isLoading: isLoadingMonthly, data: monthlyData } = useQuery('monthly', () =>
        fetch('/api/monthly').then(res => res.json()).then(d => d.sort(sortByField('month')))
    , queryOptions)

    if (isLoadingInstant || isLoadingMonthly || isLoadingDaily) {
        return <div className="spinner-border" role="status">
           <span className="sr-only">Loading...</span>
       </div>
    }

    const last12MonthlyData = monthlyData.slice(monthlyData.length - 12)

    const recentHoursData = prepareSeriesForDoughnut(latestData, 'time')
    const recentDaysData = prepareSeriesForDoughnut(dailyData, 'day')
    const recentMonthsData = prepareSeriesForDoughnut(last12MonthlyData, 'month')

    return (
        <>
        <div className="card mt-2">
          <div className="card-header">
            Averages
          </div>
          <div className="card-body">
            <div className="row">
                <div className="col-sm">
                    <h4>Last {latestData.length / 6} hours</h4>
                    <Doughnut
                        options={doughOptions}
                        data={recentHoursData}/>
                </div>
                <div className="col-sm">
                    <h4>Last {dailyData.length} days</h4>
                    <Doughnut
                        options={doughOptions}
                        data={recentDaysData}/>
                </div>
                <div className="col-sm">
                    <h4>Last {last12MonthlyData.length} months</h4>
                    <Doughnut
                        options={doughOptions}
                        data={recentMonthsData}/>
                </div>
            </div>
          </div>
        </div>
        </>
    );
}
