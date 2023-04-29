import { useQuery } from 'react-query'
import { Colour, energyGroups, colours } from '../shared/colours'
import { Doughnut } from 'react-chartjs-2';
import { queryOptions } from '../shared/queryOptions';
import { SourceIndicator } from './SourceIndicator';
import { fetchInstant } from '../shared/requests';
import formatAmount from '../shared/formatAmount';
import { ListOfMeasurements, EnergyType, MeasurementSet } from '../shared/types';
import { PVP } from './PVP';

const sumObjectValues = (data : Record<string, number>) => {
    let all = 0
    for (let key in data) {
        all += Math.round(data[key]) | 0
    }
    return all
}

export const getNegativeDataset = (data : MeasurementSet) => {
    const all = sumObjectValues(data)
    const negativeData = Object.entries(data).filter(([key, value]) => value < 0)
    const labels = negativeData.map(([key, value]) => key)
    const values = negativeData.map(([key, value]) => value)
    const backgroundColor = negativeData.map(([key, value]) => colours[key])
    labels.push('National consumption')
    values.push(-all - values.reduce((v, a) => v + a, 0))
    backgroundColor.push('lightgrey')
    return { 
        labels,
        data: values,
        backgroundColor
    }
}


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
            {...getNegativeDataset(latestData)},
            {
                label: 'GW',
                labels,
                data: clearLabels.map(k => latestData[k]),
                backgroundColor: clearLabels.map(energy => colours[energy])
            },
            {
                labels: Object.keys(energyGroups),
                data: groupByEnergyGroup(latestData),
                backgroundColor: Object.values(energyGroups).map(v => v.colour),
                cutout: '0%',
                radius: '200%'
            },
        ],
    }

    return (
        <>
        <div className="row">
            <div className="col">
                <div className="card">
                  <div className="card-header">
                     Live Status <em>{latestData.time.replace(' ', '~')}</em>
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
                    <thead style={{background: '#cfc'}}>
                        <tr><td colSpan={2}>{toPerc(renewables)} Renewables</td></tr>
                    </thead>
                    <tbody>
                        <tr><td><SourceIndicator title="Solar" type="solarpv"/></td><td>{formatAmount(latestData.solarpv)} GW</td></tr>
                        <tr><td><SourceIndicator title="Solar Thermal" type="solarthermal"/></td><td>{formatAmount(latestData.solarthermal)} GW</td></tr>
                        <tr><td><SourceIndicator title="Wind" type="wind"/></td><td>{formatAmount(latestData.wind)} GW</td></tr>
                        <tr><td><SourceIndicator title="Hydro" type="hidro"/></td><td>{formatAmount(latestData.hidro)} GW</td></tr>
                    </tbody>
                </table>
                <table className="table table-bordered">
                    <thead style={{background: '#fcc'}}>
                        <tr><td colSpan={2}>{toPerc(fossil)} Fossil Fuels</td></tr>
                    </thead>
                    <tbody>
                        <tr><td><SourceIndicator title="Carbon" type="carbon"/></td><td>{formatAmount(latestData.carbon)} GW</td></tr>
                        <tr><td><SourceIndicator title="Gas" type="gas"/></td><td>{formatAmount(latestData.gas)} GW</td></tr>
                        <tr><td><SourceIndicator title="Cogeneration" type="cogen"/></td><td>{formatAmount(latestData.cogen)} GW</td></tr>
                    </tbody>
                </table>
                <table className="table table-bordered">
                    <thead style={{background: '#aaf', color: 'white'}}>
                        <tr><td colSpan={2}>{toPerc(clean)} Other sources</td></tr>
                    </thead>
                    <tbody>
                            <tr><td><SourceIndicator title="Nuclear" type="nuclear"/></td><td>{formatAmount(latestData.nuclear)} GW</td></tr>
                            <tr><td><SourceIndicator title="Thermal" type="thermal"/></td><td>{formatAmount(latestData.thermal)} GW</td></tr>
                    </tbody>
                </table>
            </div>
            <div className="col">
                <table className="table table-bordered">
                    <thead style={{background: '#ccc'}}>
                        <tr><td colSpan={2}>{toPerc(Math.abs(latestData.inter))} Interconnectors</td></tr>
                    </thead>
                    <tbody>
                        <tr><td><SourceIndicator title="Interchanges" type="inter"/></td><td>{formatAmount(latestData.inter)} GW</td></tr>
                    </tbody>
                </table>
                <PVP />
            </div>
        </div>
        </>
    );
}
