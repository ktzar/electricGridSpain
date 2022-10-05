import { useQuery } from 'react-query'
import { Colour, energyGroups, colours } from '../shared/colours'
import { Doughnut } from 'react-chartjs-2';
import { queryOptions } from '../shared/queryOptions';
import { SourceIndicator } from './SourceIndicator';
import { fetchInstant } from '../shared/requests';
import formatAmount from '../shared/formatAmount';
import { ListOfMeasurements, EnergyType, MeasurementSet } from '../shared/types';

const groupByEnergyGroup = (data : MeasurementSet) => {
    const cleanData = Object.keys(data)
        .filter(a => data[a] > 0)
        .map(a => ({name: a, value: data[a]}))
    return Object.values(cleanData.reduce((acc : Record<string, number>, item) => {
        for (let group in energyGroups) {
            if (energyGroups[group].labels.includes(item.name)) {
                if (!acc[group]) acc[group] = 0
                acc[group] += item.value
                break
            }
        }
        return acc
    }, {}))
}

const capitaliseStr = (str : string) => str.charAt(0).toUpperCase() + str.slice(1) 

const doughnutOptions = (title = '') => ({
    responsive: true,
    plugins: {
        legend: {
            display: false,
        },
        tooltip: {
            callbacks: {
                label: function({dataset, datasetIndex, dataIndex, formattedValue} : any) {
                    const perc = dataset.data[dataIndex] / dataset.data.reduce((v : number, a : number) => v + a, 0) * 100
                    return `${capitaliseStr(dataset.labels[dataIndex])}: ${formattedValue} GW (${perc.toFixed(2)}%)`
                }
            }
        },
        title: {
            display: true,
            text: `Instant production ${title}GW`
        }
    }
})

const sumObjectValues = (data : Record<string, number>) => {
    let all = 0
    for (let key in data) {
        all += Math.round(data[key]) | 0
    }
    return all
}

export default () => {
    const { isLoading, error, data: latestData } = useQuery('instantData', fetchInstant, queryOptions)
    if (isLoading) {
        return <span>Loading...</span>
    }
    if (!latestData) {
        return <div>Error loading data</div>
    }

    const clearLabels : EnergyType[] = Object.keys(latestData).filter(k => latestData[k] > 0 && k !== 'time' && k in colours)

    const seriesData = !isLoading
        ? clearLabels.map(k => ({ name: k, value: latestData[k]}))
        : []

    const labels = Object.keys(latestData).filter(k => k !== 'time')

    const all = sumObjectValues(latestData)
    const renewables = latestData.solarpv + latestData.solarthermal + latestData.wind + latestData.hidro
    const clean = latestData.nuclear
    const fossil = latestData.gas + latestData.cogen + latestData.carbon
    const toPerc = (val : number) => Math.round( 100 * val / all).toString() + '%'

    const doughnutData = {
        labels,
        datasets: [
            {
                label: 'GW',
                labels,
                data: clearLabels.map(k => latestData[k]),
                radius: '90%',
                backgroundColor: clearLabels.map(energy => colours[energy])
            },
            {
                labels: Object.keys(energyGroups),
                data: groupByEnergyGroup(latestData),
                cutout: 0,
                radius: '130%',
                backgroundColor: Object.values(energyGroups).map(v => v.colour)
            },
            { 
                labels: ['Exported', 'Produced for national consumption'],
                data: [-latestData.inter, all],
                radius: '150%',
                backgroundColor: ['pink', 'white']
            }
        ],
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
                    <p>        
                    </p>

                  </div>
                </div>
            </div>
        </div>
        <div className="row mt-2">
            <div className="col">
                <div className="card">
                  <div className="card-header">Instant generation per source</div>
                  <div className="card-body">
                        <Doughnut options={doughnutOptions(formatAmount(parseFloat((all / 1000).toFixed(2))))} data={doughnutData} />
                  </div>
                </div>
            </div>
            <div className="col">
                    <table className="table table-bordered">
                        <thead style={{background: '#fcc'}}>
                            <tr><td colSpan={2}>{toPerc(fossil)} Fossil Fuels</td></tr>
                        </thead>
                        <tbody>
                            <tr><td><SourceIndicator type="carbon"/>Carbon</td><td>{formatAmount(latestData.carbon)} GW</td></tr>
                            <tr><td><SourceIndicator type="gas"/>Gas</td><td>{formatAmount(latestData.gas)} GW</td></tr>
                        </tbody>
                    </table>
                    <table className="table table-bordered">
                        <thead style={{background: '#cfc'}}>
                            <tr><td colSpan={2}>{toPerc(renewables)} Renewables</td></tr>
                        </thead>
                        <tbody>
                            <tr><td><SourceIndicator type="solarpv"/>Solar</td><td>{formatAmount(latestData.solarpv)} GW</td></tr>
                            <tr><td><SourceIndicator type="solarthermal"/>Solar Thermal</td><td>{formatAmount(latestData.solarthermal)} GW</td></tr>
                            <tr><td><SourceIndicator type="wind"/>Wind</td><td>{formatAmount(latestData.wind)} GW</td></tr>
                        </tbody>
                    </table>
            </div>
            <div className="col">
                <table className="table table-bordered">
                    <thead style={{background: '#aaf', color: 'white'}}>
                        <tr><td colSpan={2}>{toPerc(clean)} Other sources</td></tr>
                    </thead>
                    <tbody>
                            <tr><td><SourceIndicator type="nuclear"/>Nuclear</td><td>{formatAmount(latestData.nuclear)} GW</td></tr>
                            <tr><td><SourceIndicator type="thermal"/>Thermal</td><td>{formatAmount(latestData.thermal)} GW</td></tr>
                    </tbody>
                </table>
                <table className="table table-bordered">
                    <thead style={{background: '#ccc'}}>
                        <tr><td colSpan={2}>{toPerc(Math.abs(latestData.inter))} Interconnectors</td></tr>
                    </thead>
                    <tbody>
                        <tr><td><SourceIndicator type="inter"/>Interchanges</td><td>{formatAmount(latestData.inter)} GW</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
        </>
    );
}
