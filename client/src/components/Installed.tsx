import { chartOptions } from '../shared/chartOptions';
import { queryOptions } from '../shared/queryOptions';
import { Line } from 'react-chartjs-2';
import { fetchMonthlyInstalled, fetchYearlyInstalled,  } from '../shared/requests';
import { useQuery } from 'react-query';
import { colours } from '../shared/colours'

interface InstalledRecord {
    installedWind: number,
    installedSolar: number,
}

const dataToDataset = (data : InstalledRecord[], type : 'installedWind' | 'installedSolar')  => ({
        label: 'GW',
        data: data.map(d => d[type]),
        fill: false,
        tension: 0.3,
        backgroundColor: 'rgb(255, 99, 132)',
        borderColor: colours[type],
        borderWidth: 1.5
    })


export const Installed = () => {
    const { isLoading: isLoadingMonthly, data: monthlyInstalled } = useQuery('monthlyInstalled', fetchMonthlyInstalled, queryOptions)
    const { isLoading: isLoadingYearly, data: yearlyInstalled } = useQuery('yearlyInstalled', fetchYearlyInstalled, queryOptions)

    if (isLoadingMonthly || isLoadingYearly) return <h2>Loading...</h2>

    const monthlyData = {
        labels: monthlyInstalled.map((d : any) => d.month),
        datasets: [
            dataToDataset(monthlyInstalled, 'installedWind'),
            dataToDataset(monthlyInstalled, 'installedSolar')
        ]
    }

    const yearlyData = {
        labels: yearlyInstalled.map((d : any) => d.year),
        datasets: [
            dataToDataset(yearlyInstalled, 'installedWind'),
            dataToDataset(yearlyInstalled, 'installedSolar')
        ]
    }

    console.log({monthlyData, yearlyData})

    return <>
        <div className="card mt-2">
            <div className="card-header">
                How much power is installed for some technologies
            </div>
            <div className="card-body">
                <div className="row">
                    <div className="col-sm-6">
                        <h5>Last {monthlyInstalled.length} months</h5>
                        <Line options={chartOptions({title: `Installed`})} data={monthlyData}/>
                    </div>
                    <div className="col-sm-6">
                        <h5>Last {yearlyInstalled.length} years</h5>
                        <Line options={chartOptions({title: `Installed`})} data={yearlyData}/>
                    </div>
                </div>
            </div>
        </div>
</>
}