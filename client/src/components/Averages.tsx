import { PieChart, Pie, Sector, Cell, ResponsiveContainer } from 'recharts';
import { useQuery } from 'react-query'
import { colours } from '../shared/colours'
import { Doughnut } from 'react-chartjs-2';

const doughOptions = {
    responsive: true,
    plugins: {
        legend: {
            display: false,
            position: 'top',
        },
        title: {
            display: true,
            text: 'Produced GWh'
        }
    }
}

export default () => {
    const { isLoading: isLoadingDaily, data: dailyData } = useQuery('daily', () =>
        fetch('/api/daily').then(res => res.json())
    )
    const { isLoading: isLoadingMonthly, data: monthlyData } = useQuery('monthly', () =>
        fetch('/api/monthly').then(res => res.json())
    )
    const { isLoading: isLoadingYearly, data: yearlyData } = useQuery('yearly', () =>
        fetch('/api/yearly').then(res => res.json())
    )

    if (isLoadingYearly || isLoadingMonthly || isLoadingDaily) {
        return <div class="spinner-border" role="status">
           <span class="sr-only">Loading...</span>
       </div>
    }

    const yesterday = dailyData[1]
    const lastDayData = Object.keys(yesterday)
        .filter(k => yesterday[k] > 0 && k !== 'day')
        .map(k => ({ name: k, value: yesterday[k]}))

    const lastMonth = monthlyData[1]
    const lastMonthData = Object.keys(lastMonth)
        .filter(k => lastMonth[k] > 0 && k !== 'month')
        .map(k => ({ name: k, value: lastMonth[k]}))

    const lastYear = yearlyData[1]
    const lastYearData = Object.keys(lastYear)
        .filter(k => lastYear[k] > 0 && k !== 'year')
        .map(k => ({ name: k, value: lastYear[k]}))

    const lastDayDoughnutData = {
        labels: lastDayData.map(k => k.name),
        datasets: [
            {
                label: 'GWh',
                data: lastDayData.map(k => parseInt(k.value)),
                backgroundColor: lastDayData.map(k => colours[k.name]),
            }
        ]
    }

    const lastMonthDoughnutData = {
        labels: lastMonthData.map(k => k.name),
        datasets: [
            {
                label: 'GWh',
                data: lastMonthData.map(k => parseInt(k.value)),
                backgroundColor: lastMonthData.map(k => colours[k.name]),
            }
        ]
    }

    const lastYearDoughnutData = {
        labels: lastYearData.map(k => k.name),
        datasets: [
            {
                label: 'GWh',
                data: lastYearData.map(k => parseInt(k.value)),
                backgroundColor: lastYearData.map(k => colours[k.name]),
            }
        ]
    }

    return (
        <>
        <div className="card mt-2">
          <div className="card-header">
            Averages
          </div>
          <div className="card-body">
            <div className="row">
                <div className="col-sm">
                    <h4>Yesterday</h4>
                    <Doughnut
                        options={doughOptions}
                        data={lastDayDoughnutData}/>
                </div>
                <div className="col-sm">
                    <h4>Last Month</h4>
                    <Doughnut
                        options={doughOptions}
                        data={lastMonthDoughnutData}/>
                </div>
                <div className="col-sm">
                    <h4>Last Year</h4>
                    <Doughnut
                        options={doughOptions}
                        data={lastYearDoughnutData}/>
                </div>
            </div>
          </div>
        </div>
        </>
    );
}
