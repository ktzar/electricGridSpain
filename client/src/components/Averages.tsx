import { useQuery } from 'react-query'
import { energyGroups, colours } from '../shared/colours'
import { Doughnut } from 'react-chartjs-2';
import { queryOptions } from '../shared/queryOptions';
import { sortByField } from '../shared/fields';
import { fetchDaily, fetchMonthly, fetchInstant } from '../shared/requests';
import formatAmount from '../shared/formatAmount';
import { MeasurementSet, ListOfMeasurements, EnergyType } from '../shared/types';

const capitaliseStr = (str : string) => str.charAt(0).toUpperCase() + str.slice(1) 

const doughOptions = (title = '') => ({
    responsive: true,
    plugins: {
        tooltip: {
            callbacks: {
                label: function({dataset, datasetIndex, dataIndex, formattedValue} : any) {
                    const perc = dataset.data[datasetIndex] / dataset.data.reduce((v : number, a : number) => v + a, 0) * 100
                    return `${capitaliseStr(dataset.labels[dataIndex])}: ${formattedValue} GW (${perc.toFixed(2)}%)`
                }
            }
        },
        legend: {
            display: false,
        },
        title: {
            display: true,
            text: `Average GW production ${title}`
        }
    }
})


const energyTypes = [
    'solarpv',
    'solarthermal',
    'wind',
    'hidro',
    'nuclear',
    'thermal',
    'cogen',
    'gas',
    'carbon',
]

const groupByEnergyGroup = (data : ListOfMeasurements) => {
    return Object.values(data.reduce((acc : Record<string, number>, item) => {
        for (let group in energyGroups) {
            if (energyGroups[group].labels.includes(item.name)) {
                if (!acc[group]) acc[group] = 0
                acc[group] += item.value
                break
            }
        }
        return acc
    }, {}))
}

const accumulateMeasurements = (measList : MeasurementSet[]) => 
    measList.reduce((meas, acc) => {
        for (let key in meas) {
            if (!acc[key]) acc[key] = 0
            acc[key] += meas[key]
        }
        return acc
    }, {})


const dataToDoughnut = (data : ListOfMeasurements) => ({
    labels: data.map(k => k.name).concat(Object.keys(energyGroups)),
    datasets: [
        {
            labels: data.map(k => k.name),
            data: data.map(k => k.value),
            radius: '100%',
            cutout: 70,
            backgroundColor: data.map(k => colours[k.name]),
        },
        {
            labels: Object.keys(energyGroups),
            cutout: 45,
            radius: '130%',
            data: groupByEnergyGroup(data),
            backgroundColor: Object.values(energyGroups).map(v => v.colour)
        }
    ]
})

const createKeyRemover = (key : string) => (obj : Record<string, any>) => {
    const tmp = {...obj}
    delete tmp[key]
    return tmp
}

const prepareSeriesForDoughnut = (series : MeasurementSet[], timeField : string, scaleDown = 1) => {
    const timeRemover = createKeyRemover(timeField)
    const recentValues = accumulateMeasurements(series.map(timeRemover))
    return dataToDoughnut(
        energyTypes
            .map(key => ({name: key, value: Math.round(recentValues[key] / scaleDown)}))
            .filter(val => val.value > 0)
    )
}


export default () => {
    const { isLoading: isLoadingInstant, data: latestData } = useQuery('latestData', () => {
        return fetch('/api/latest').then(res => res.json()).then(d => d.sort(sortByField('time')))
    }, queryOptions)
    const { isLoading: isLoadingDaily, data: dailyData } = useQuery('daily', fetchDaily, queryOptions)
    const { isLoading: isLoadingMonthly, data: monthlyData } = useQuery('monthly', fetchMonthly, queryOptions)

    if (isLoadingInstant || isLoadingMonthly || isLoadingDaily) {
        return <div className="spinner-border" role="status">
           <span className="sr-only"></span>
       </div>
    }

    const last12MonthlyData = monthlyData.slice(monthlyData.length - 12)

    const recentHoursData = prepareSeriesForDoughnut(latestData, 'time', latestData.length)
    const recentDaysData = prepareSeriesForDoughnut(dailyData, 'day', dailyData.length * 24)
    const recentMonthsData = prepareSeriesForDoughnut(last12MonthlyData, 'month', last12MonthlyData.length * 30 * 24)

    const averageHoursProduction = recentHoursData.datasets[0].data.reduce((a, b) => a+b, 0)
    const averageDaysProduction = recentDaysData.datasets[0].data.reduce((a, b) => a+b, 0)
    const averageMonthsProduction = recentMonthsData.datasets[0].data.reduce((a, b) => a+b, 0)

    return (
        <>
        <div className="card mt-2">
          <div className="card-header">
            Averages
          </div>
          <div className="card-body">
            <div className="row">
                <div className="col-sm-4">
                    <h5>Last {latestData.length / 6} hours</h5>
                    <Doughnut
                        options={doughOptions(`${formatAmount(averageHoursProduction)} GW`)}
                        data={recentHoursData}/>
                </div>
                <div className="col-sm-4">
                    <h5>Last {dailyData.length} days</h5>
                    <Doughnut
                        options={doughOptions(`${formatAmount(averageDaysProduction)} GW`)}
                        data={recentDaysData}/>
                </div>
                <div className="col-sm-4">
                    <h5>Last {last12MonthlyData.length} months</h5>
                    <Doughnut
                        options={doughOptions(`${formatAmount(averageMonthsProduction)} GW`)}
                        data={recentMonthsData}/>
                </div>
            </div>
          </div>
        </div>
        </>
    );
}
