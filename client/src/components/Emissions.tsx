import { chartOptions } from '../shared/chartOptions';
import { queryOptions } from '../shared/queryOptions';
import { Line } from 'react-chartjs-2';
import { fetchDailyEmissions, fetchMonthlyEmissions, fetchYearlyEmissions,  } from '../shared/requests';
import { useQuery } from 'react-query';

interface EmissionRecord {
    emissions: number
}

const dataToDataset = (data : EmissionRecord[])  => ({
        label: 'CO2',
        data: data.map(d => d.emissions),
        fill: false,
        tension: 0.3,
        backgroundColor: 'rgb(255, 99, 132)',
        borderColor: 'rgba(200, 100, 0, 1)',
        borderWidth: 1.5
    })


export const Emissions = () => {
    const { isLoading: isLoadingDaily, data: dailyEmissions } = useQuery('dailyEmissions', fetchDailyEmissions, queryOptions)
    const { isLoading: isLoadingMonthly, data: monthlyEmissions } = useQuery('monthlyEmissions', fetchMonthlyEmissions, queryOptions)
    const { isLoading: isLoadingYearly, data: yearlyEmissions } = useQuery('yearlyEmissions', fetchYearlyEmissions, queryOptions)


    if (isLoadingDaily || isLoadingMonthly || isLoadingYearly ) return <h2>Loading...</h2>

    const dailyData = {
        labels: dailyEmissions.map((d : any) => d.day),
        datasets: [
            dataToDataset(dailyEmissions)
        ]
    }

    const monthlyData = {
        labels: monthlyEmissions.map((d : any) => d.month),
        datasets: [
            dataToDataset(monthlyEmissions)
        ]
    }

    const yearlyData = {
        labels: yearlyEmissions.map((d : any) => d.year),
        datasets: [
            dataToDataset(yearlyEmissions)
        ]
    }

    const unit = 'gCO2/kWh'

    return <>
        <div className="card mt-2">
            <div className="card-header">
                How many grams of CO2 is sent to the atmosphere to produce a kWh of electricity.
            </div>
            <div className="card-body">
                <div className="row">
                    <div className="col-sm-4">
                        <h5>Emissions in the last {dailyEmissions.length} days</h5>
                        <Line options={chartOptions({title: `Emissions gCO2/kWh in period`, unit})} data={dailyData}/>

                    </div>
                    <div className="col-sm-4">
                        <h5>Emissions in the last {monthlyEmissions.length} months</h5>
                        <Line options={chartOptions({title: `Emissions gCO2/kWh in period`, unit})} data={monthlyData}/>
                    </div>
                    <div className="col-sm-4">
                        <h5>Emissions in the last { yearlyEmissions.length } years</h5>
                        <Line options={chartOptions({title: `Emissions gCO2/kWh in period`, unit})} data={yearlyData}/>
                    </div>
                </div>
            </div>
        </div>
</>
}