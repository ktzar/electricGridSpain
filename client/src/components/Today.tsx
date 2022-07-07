import { useQuery } from 'react-query'
import { EnergyType, colours } from '../shared/colours'
import { Doughnut } from 'react-chartjs-2';
import { queryOptions } from '../shared/queryOptions';
import { SourceIndicator } from './SourceIndicator';

const doughOptions = {
    responsive: true,
    plugins: {
        legend: {
            display: false,
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
const formatAmount = (nmb : number) => formatter.format(nmb)
const sumObjectValues = (data : Record<string, number>) => {
    let all = 0
    for (let key in data) {
        all += Math.round(data[key])
    }
    return all
}

export default () => {
    const { isLoading, error, data: latestData } = useQuery('instantData', () => {
        return fetch('/api/instant')
            .then(res => res.json())
    }, queryOptions)
    console.log({ isLoading, error, latestData })

    if (isLoading) {
        return <span>Loading...</span>
    }

    const clearLabels : EnergyType[] = Object.keys(latestData).filter(k => latestData[k] > 0 && k !== 'time' && k in colours)

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

    const all = sumObjectValues(latestData)
    const renewables = latestData.solarpv + latestData.solarthermal + latestData.wind + latestData.hidro
    const clean = latestData.nuclear
    const fossil = latestData.gas + latestData.cogen + latestData.carbon

    const toPerc = (val : number) => Math.round( 100 * val / all).toString() + '%'

    console.log({doughData, latestData})

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
                  <div className="card-header"> {formatAmount(parseFloat((all / 1000).toFixed(2)))} GW demand </div>
                  <div className="card-body">
                        <Doughnut options={doughOptions} data={doughData} />
                  </div>
                </div>
            </div>
            <div className="col">
                    <table className="table table-bordered">
                        <thead style={{background: '#fcc'}}>
                            <tr><td colSpan={2}>{toPerc(fossil)} Fossil Fuels</td></tr>
                        </thead>
                        <tbody>
                            <tr><td><SourceIndicator type="carbon"/>Carbon</td><td>{formatAmount(latestData?.carbon)} GW</td></tr>
                            <tr><td><SourceIndicator type="gas"/>Gas</td><td>{formatAmount(latestData?.gas)} GW</td></tr>
                        </tbody>
                    </table>
                    <table className="table table-bordered">
                        <thead style={{background: '#cfc'}}>
                            <tr><td colSpan={2}>{toPerc(renewables)} Renewables</td></tr>
                        </thead>
                        <tbody>
                            <tr><td><SourceIndicator type="solarpv"/>Solar</td><td>{formatAmount(latestData?.solarpv)} GW</td></tr>
                            <tr><td><SourceIndicator type="solarthermal"/>Solar Thermal</td><td>{formatAmount(latestData?.solarthermal)} GW</td></tr>
                            <tr><td><SourceIndicator type="wind"/>Wind</td><td>{formatAmount(latestData?.wind)} GW</td></tr>
                        </tbody>
                    </table>
            </div>
            <div className="col">
                <table className="table table-bordered">
                    <thead style={{background: '#777', color: 'white'}}>
                        <tr><td colSpan={2}>{toPerc(clean)} Other sources</td></tr>
                    </thead>
                    <tbody>
                            <tr><td><SourceIndicator type="nuclear"/>Nuclear</td><td>{formatAmount(latestData?.nuclear)} GW</td></tr>
                            <tr><td><SourceIndicator type="thermal"/>Thermal</td><td>{formatAmount(latestData?.thermal)} GW</td></tr>
                    </tbody>
                </table>
                <table className="table table-bordered">
                    <thead style={{background: '#ccc'}}>
                        <tr><td colSpan={2}>{toPerc(Math.abs(latestData.inter))} Interconnectors</td></tr>
                    </thead>
                    <tbody>
                        <tr><td><SourceIndicator type="inter"/>Interchanges</td><td>{formatAmount(latestData?.inter)} GW</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
        </>
    );
}
