import { colours } from '../shared/colours'
import { EnergyLineChart } from './EnergyLineChart'
import { Line } from 'react-chartjs-2';
import { useQuery } from 'react-query'
import { queryOptions } from '../shared/queryOptions';

const chartOptions = ({title = 'Production per period (GWh)'} = {}) => ({
    responsive: true,
    plugins: {
        title: {
            display: true,
            text: title
        },
        legend: {
            display: false
        },
    },
    animation: { duration: 0 },
    elements: {
        point:{
            radius: 0
        }
    },
    interaction: {
        intersect: false,
    },
    scales: {
        x: {
            display: false,
            title: {
                display: true
            }
        },
        y: {
            display: true,
            title: {
                display: true,
                text: 'GWh'
            },
        }
    }
});

const labelToDataset = (data : Record<string, any>) => (label : string) => (
    {
        label,
        data: data.map(k => k[label]),
        borderColor: colours[label],
        tension: 0.3,
        borderWidth: 1.5
    }
)

const sortByField = field => (a,b) => a[field] > b[field] ? 1 : -1

export default () => {
    const { isLoading, error, data: latestData } = useQuery('latestData', () => {
        return fetch('/api/latest').then(res => res.json()).then(d => d.sort(sortByField('time')))
    }, queryOptions)

    const { isLoading: isLoadingDaily, data: dailyData } = useQuery('daily', () =>
        fetch('/api/daily').then(res => res.json())
    , queryOptions)

    const { isLoading: isLoadingMonthly, data: monthlyData } = useQuery('monthly', () =>
        fetch('/api/monthly').then(res => res.json()).then(d => d.sort(sortByField('month')))
    , queryOptions)

    const { isLoading: isLoadingYearly, data: yearlyData } = useQuery('yearly', () =>
        fetch('/api/yearly').then(res => res.json()).then(d => d.sort(sortByField('year')))
    , queryOptions)

    if (isLoading || isLoadingMonthly || isLoadingDaily || isLoadingYearly) {
        return <div className="spinner-border" role="status">
           <span className="sr-only">Loading...</span>
       </div>
    }

    const clearLabels = Object.keys(latestData[0]).filter(k => k !== 'time')

    return (
        <>
        <div className="card mt-2">
          <div className="card-header">
        Recent production per source
        </div>
          <div className="card-body">
            <div className="row">
                <div className="col">
                    <h5 className="text-center">Last {parseInt(latestData.length / 6).toString()} hours</h5>
                    <Line options={chartOptions({title: 'Instant production'})} data={{
                        labels: latestData.map(k => k.time),
                        datasets: clearLabels.map(labelToDataset(latestData))
                    }}/>
                </div>
                <div className="col">
                    <h5 className="text-center">Last {dailyData.length} days</h5>
                    <Line options={chartOptions()} data={{
                        labels: dailyData.map(k => k.day),
                        datasets: clearLabels.map(labelToDataset(dailyData))
                    }}/>
                </div>
            </div>
            <div className="row">
                <div className="col">
                    <h5 className="text-center">Last {monthlyData.length} months</h5>
                    <Line options={chartOptions()} data={{
                        labels: monthlyData.map(k => k.month),
                        datasets: clearLabels.map(labelToDataset(monthlyData))
                    }}/>
                </div>
                <div className="col">
                    <h5 className="text-center">Last {yearlyData.length} years</h5>
                    <Line options={chartOptions()} data={{
                        labels: yearlyData.map(k => k.year),
                        datasets: clearLabels.map(labelToDataset(yearlyData))
                    }}/>
                </div>
            </div>
          </div>
        </div>
        </>
    );
}
