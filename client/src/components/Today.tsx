//import { Legend, Tooltip, PieChart, Pie, Sector, Cell, ResponsiveContainer } from 'recharts'
import { useQuery } from 'react-query'
import { colours } from '../shared/colours'
import { Doughnut } from 'react-chartjs-2';
import { queryOptions } from '../shared/queryOptions';
//import ChartistGraph from 'react-chartist';

const doughOptions = {
    responsive: true,
    plugins: {
        legend: {
            display: false,
            position: 'top',
        },
        tooltips: {
            display: true,
            enabled: true
        },
        title: {
            display: true,
            text: 'Instant GW per source'
        }
    }
}

const formatter = Intl.NumberFormat('en-GB')
const formatAmount = nmb => formatter.format(nmb)



export default () => {
    const { isLoading, error, data: latestData } = useQuery('instantData', () => {
        return fetch('/api/instant')
            .then(res => res.json())
    }, queryOptions)
    console.log({ isLoading, error, latestData })

    if (isLoading) {
        return <span>Loading...</span>
    }

    const clearLabels = Object.keys(latestData).filter(k => latestData[k] > 0 && k !== 'time')

    const seriesData = !isLoading
        ? clearLabels.map(k => ({ name: k, value: latestData[k]}))
        : []



    const doughData = {
        labels: Object.keys(latestData).filter(k => k !== 'time'),
        datasets: [
            {
                label: 'GW',
                data: clearLabels.map(k => latestData[k]),
                backgroundColor: clearLabels.map(energy => colours[energy])
            }
        ],
    }

    console.log({doughData})

    return (
        <>
        <div className="row">
            <div className="col">
                <div className="card">
                  <div className="card-header">
                     Live Status at {latestData.time}
                  </div>
                  <div className="card-body">
                    <h5 className="card-title">Red Eléctrica de España</h5>
                    <p className="card-text">Red Eléctrica de España is a partly state-owned and public limited Spanish corporation which operates the national electricity grid in Spain, where it operates the national power transmission system.</p>
                    <p>        
                    </p>

                  </div>
                </div>
            </div>
        </div>
        <div className="row mt-2">
            <div className="col">
                <div className="card">
                  <div className="card-header"> 33.1 GW demand </div>
                  <div className="card-body">
                        <Doughnut options={doughOptions} data={doughData} />
                        {/*
                        <PieChart width={200} height={250}>
                            <Pie data={seriesData} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={50} fill="#82ca9d" label >
                                {seriesData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={colours[entry.name]} />
                                             ))}
                            </Pie>
                            <Legend />

                        </PieChart>
                        */}
                  </div>
                </div>
            </div>
            <div className="col">
                    <table className="table table-bordered">
                        <thead style={{background: '#fcc'}}>
                            <tr><td colSpan="2">59% Fossil Fuels</td></tr>
                        </thead>
                        <tbody>
                            <tr><td>Carbon</td><td>{formatAmount(latestData?.carbon)} GW</td></tr>
                            <tr><td>Gas</td><td>{formatAmount(latestData?.gas)} GW</td></tr>
                        </tbody>
                    </table>
                <div className="card mt-2">
                  <div className="card-header" style={{background: '#cfc'}}>33% Renewables</div>
                  <div className="card-body">
                    <table className="table table-bordered">
                        <tbody>
                            <tr><td>Solar</td><td>{formatAmount(latestData?.solarpv)} GW</td></tr>
                            <tr><td>Solar Thermal</td><td>{formatAmount(latestData?.solarthermal)} GW</td></tr>
                            <tr><td>Wind</td><td>{formatAmount(latestData?.wind)} GW</td></tr>
                        </tbody>
                    </table>
                  </div>
                </div>
            </div>
            <div className="col">
                <div className="card">
                  <div className="card-header">59% Other sources</div>
                  <div className="card-body">
                  </div>
                </div>
                <div className="card mt-2">
                  <div className="card-header">33% Interconnectors</div>
                  <div className="card-body">
                    <table className="table table-bordered">
                        <tbody>
                            <tr><td>Interchanges</td><td>{formatAmount(latestData?.inter)} GW</td></tr>
                        </tbody>
                    </table>
                  </div>
                </div>
            </div>
        </div>
        </>
    );
}
