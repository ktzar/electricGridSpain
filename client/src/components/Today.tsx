import { Legend, Tooltip, PieChart, Pie, Sector, Cell, ResponsiveContainer } from 'recharts'
import { useQuery } from 'react-query'
import { colours } from '../shared/colours'

export default () => {
    const { isLoading, error, data: latestData } = useQuery('instantData', () => {
        return fetch('/api/instant')
            .then(res => res.json())
    })
    console.log({ isLoading, error, latestData })

    const seriesData = !isLoading
        ? Object.keys(latestData)
            .filter(k => latestData[k] > 0 && k !== 'time')
            .map(k => ({ name: k, value: latestData[k]}))
        : []


    if (isLoading) {
        return <span>Loading...</span>
    }
    
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
                  </div>
                </div>
            </div>
        </div>
        <div className="row mt-2">
            <div className="col">
                <div className="card">
                  <div className="card-header"> 33.1 GW demand </div>
                  <div className="card-body">
                        <PieChart width={200} height={250}>
                            <Pie data={seriesData} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={50} fill="#82ca9d" label >
                                {seriesData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={colours[entry.name]} />
                                             ))}
                            </Pie>
                            <Legend />

                        </PieChart>
                  </div>
                </div>
            </div>
            <div className="col">
                <div className="card">
                  <div className="card-header card-header-danger">59% Fossil fuels</div>
                  <div className="card-body">
                    <table>
                        <tbody>
                            <tr><td>Carbon</td><td>{latestData?.carbon}GW</td></tr>
                            <tr><td>Gas</td><td>{latestData?.gas}GW</td></tr>
                        </tbody>
                    </table>
                  </div>
                </div>
                <div className="card mt-2">
                  <div className="card-header bg-primary">33% Renewables</div>
                  <div className="card-body">
                    <table>
                        <tbody>
                            <tr><td>Solar</td><td>{latestData?.solarpv}GW</td></tr>
                            <tr><td>Solar Thermal</td><td>{latestData?.solarthermal}GW</td></tr>
                            <tr><td>Wind</td><td>{latestData?.wind}GW</td></tr>
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
                  </div>
                </div>
            </div>
        </div>
        </>
    );
}
