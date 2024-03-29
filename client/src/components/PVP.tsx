import dayjs from 'dayjs';
import { Line } from 'react-chartjs-2';
import { chartOptions } from '../shared/chartOptions';
import { fetchHourlyPvp } from '../shared/requests';
import { queryOptions } from '../shared/queryOptions';
import { useQuery } from 'react-query';

export const PVP = () => {
    const { isLoading, data} = useQuery('hourlyPvp', fetchHourlyPvp, queryOptions)

    if (!data || isLoading) return <h2>Loading...</h2>

    const monthlyData = {
        labels: data.map((d : any) => dayjs(d.hour + ':00').format('dd-HH') + 'h'),
        datasets: [
            {
                label: 'PVPC (€)',
                data: data.map((d : any) => d.pvpc),
                fill: false,
                tension: 0.3,
                backgroundColor: 'rgb(255, 99, 132)',
                borderColor: 'rgb(255, 99, 132)',
                borderWidth: 1.5

            }
        ]
    }

    console.log({ monthlyData })


    return <>
        <div className="card">
            <div className="card-header">Consumer price (€/MWh) 72h</div>
            <div className="card-body">
                <Line options={chartOptions({ title: ``, unit: '€/MWh', max: 0, displayXAxis: true })} data={monthlyData} />
            </div>
        </div>
    </>
}
