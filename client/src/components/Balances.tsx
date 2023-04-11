import { chartOptions } from '../shared/chartOptions';
import { queryOptions } from '../shared/queryOptions';
import { Line } from 'react-chartjs-2';
import { fetchDailyBalances, fetchMonthlyBalances, fetchYearlyBalances,  } from '../shared/requests';
import { useQuery } from 'react-query';
import { colours } from '../shared/colours'
import { SourceIndicator } from './SourceIndicator';

interface BalanceRecord {
    balanceMorocco: number,
    balancePortugal: number,
    balanceFrance: number,
}

type BalanceRecordKeys = keyof BalanceRecord

const dataToDataset = (data : BalanceRecord[], country : BalanceRecordKeys)  => ({
        label: 'GWh',
        data: data.map(d => d[country]),
        fill: false,
        tension: 0.3,
        backgroundColor: 'rgb(255, 99, 132)',
        borderColor: colours[country],
        borderWidth: 1.5
    })

const dataToDatasets = (data : BalanceRecord[]) => {
    return [
        dataToDataset(data, 'balanceFrance'),
        dataToDataset(data, 'balancePortugal'),
        dataToDataset(data, 'balanceMorocco')
    ]
}


export const Balances = () => {
    const { isLoading: isLoadingDaily, data: dailyBalances } = useQuery('dailyBalances', fetchDailyBalances, queryOptions)
    const { isLoading: isLoadingMonthly, data: monthlyBalances } = useQuery('monthlyBalances', fetchMonthlyBalances, queryOptions)
    const { isLoading: isLoadingYearly, data: yearlyBalances } = useQuery('yearlyBalances', fetchYearlyBalances, queryOptions)


    if (isLoadingDaily || isLoadingMonthly || isLoadingYearly) return <h2>Loading...</h2>

    const dailyData = {
        labels: dailyBalances.map((d : any) => d.day),
        datasets: dataToDatasets(dailyBalances)
    }

    const monthlyData = {
        labels: monthlyBalances.map((d : any) => d.month),
        datasets: dataToDatasets(monthlyBalances)
    }

    const yearlyData = {
        labels: yearlyBalances.map((d : any) => d.year),
        datasets: dataToDatasets(yearlyBalances)
    }

    return <>
        <div className="card mt-2">
            <div className="card-header">
                How many GWh have been imported/exported from/to each country
            </div>
            <div className="card-body">
                <div className="row">
                    <div className="col-sm-4">
                        <h5>Last {dailyBalances.length} days</h5>
                        <Line options={chartOptions({title: `Balances`})} data={dailyData}/>
                    </div>
                    <div className="col-sm-4">
                        <h5>Last {monthlyBalances.length} months</h5>
                        <Line options={chartOptions({title: `Balances`})} data={monthlyData}/>
                    </div>
                    <div className="col-sm-4">
                        <h5>Last {yearlyBalances.length} years</h5>
                        <Line options={chartOptions({title: `Balances`})} data={yearlyData}/>
                    </div>
                </div>
                <div className="row">
                    <div className="col-sm-12">
                        France <SourceIndicator type="balanceFrance" />
                        Portugal <SourceIndicator type="balancePortugal" />
                        Morocco <SourceIndicator type="balanceMorocco" />
                    </div>
                </div>
            </div>
        </div>
</>
}