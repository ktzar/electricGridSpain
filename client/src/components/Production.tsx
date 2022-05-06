import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { colours } from '../shared/colours'
import { EnergyLineChart } from './EnergyLineChart'
import { useQuery } from 'react-query'

export default () => {
    const { isLoading, error, data: latestData } = useQuery('latestData', () => {
        return fetch('/api/latest')
            .then(res => res.json())
    })

    const { isLoading: isLoadingDaily, data: dailyData } = useQuery('daily', () =>
        fetch('/api/daily').then(res => res.json())
    )

    const { isLoading: isLoadingMonthly, data: monthlyData } = useQuery('monthly', () =>
        fetch('/api/monthly').then(res => res.json())
    )

    if (isLoading || isLoadingMonthly || isLoadingDaily) {
        return <div class="spinner-border" role="status">
           <span class="sr-only">Loading...</span>
       </div>
    }

    return (
        <>
        <div className="card mt-2">
          <div className="card-header">
        National Grid: Live Status (9:00pm 27/04/2022)
        </div>
          <div className="card-body">
            <div className="row">
                <div className="col">
                    <h5>Last 24h</h5>
                    <EnergyLineChart
                        xAxis="time"
                        series={latestData.reverse()} />
                </div>
                <div className="col">
                    <h5>Last 30 days</h5>
                    <EnergyLineChart
                        xAxis="day"
                        series={dailyData.reverse()} />
                </div>
                <div className="col">
                    <h5>Last year</h5>
                    <EnergyLineChart
                        xAxis="month"
                        series={monthlyData.reverse()} />
                </div>
                <div className="col">
                </div>
            </div>
          </div>
        </div>
        </>
    );
}
