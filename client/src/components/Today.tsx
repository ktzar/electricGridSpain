import { useQuery } from 'react-query'
import { Colour, energyGroups, colours } from '../shared/colours'
import { Doughnut } from 'react-chartjs-2';
import { queryOptions } from '../shared/queryOptions';
import { SourceIndicator } from './SourceIndicator';
import { fetchInstant } from '../shared/requests';
import formatAmount from '../shared/formatAmount';
import { ListOfMeasurements, EnergyType, MeasurementSet } from '../shared/types';
import { PVP } from './PVP';
import { Battery } from './Battery';
import { BatteryDaily } from './BatteryDaily';
import { ErrorBoundary } from './ErrorBoundary';

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
                    return `${capitaliseStr(dataset.labels[dataIndex])}: ${formattedValue} MW (${perc.toFixed(2)}%)`
                }
            }
        },
        title: {
            display: true,
            text: `Instant production ${title}`
        }
    }
})

const Card = ({title, colour, margin = '', children}) => {
    return (
        <div className={'card ' + margin}>
          <div className="card-header">{title}</div>
          <div className="card-body">
               <ErrorBoundary label={title}>{children}</ErrorBoundary>
          </div>
        </div>
    );
};

const Table = ({title, colour, children}) => {
    return (
        <table className="table table-bordered table-sm">
            <thead style={{background: colour}}>
                <tr><td colSpan={2}>{title}</td></tr>
            </thead>
            <tbody>
                {children}
            </tbody>
        </table>
)};

const Row = ({type, value}) => {
    return <tr><td><SourceIndicator type={type}/></td><td>{formatAmount(value)}</td></tr>
}

export default () => {
    const { isLoading, error, data: latestData } = useQuery('instantData', fetchInstant, queryOptions)

    if (isLoading) {
        return <span>Loading...</span>
    }
    if (!latestData) {
        return <div>Error loading data</div>
    }

    const clearLabels : EnergyType[] = Object.keys(latestData).filter(k => latestData[k] >= 0 && k !== 'time' && k in colours)

    const seriesData = !isLoading
        ? clearLabels.map(k => ({ name: k, value: latestData[k]}))
        : []

    const labels = Object.keys(latestData).filter(k => k !== 'time')

    const all = sumObjectValues(latestData)
    const renewables = latestData.solarpv + latestData.solarthermal + latestData.wind + latestData.hidro
    const clean = latestData.nuclear
    const fossil = latestData.gas + latestData.cogen + latestData.carbon
    const toPerc = (val : number) => Math.round( 100 * val / all).toString() + '%'
    const negativeDataSet = getNegativeDataset(latestData)

    const doughnutData = {
        labels,
        datasets: [
            {...negativeDataSet},
            {
                label: 'MW',
                labels: clearLabels,
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
                <PVP />
            </div>
            <div className="col">
                <Table colour='#cfc' title={toPerc(renewables) + ' Renewables'}>
                    <>
                        <Row type="solarpv" value={latestData.solarpv}/>
                        <Row type="solarthermal" value={latestData.solarthermal}/>
                        <Row type="wind" value={latestData.wind}/>
                        <Row type="hidro" value={latestData.hidro}/>
                    </>
                </Table>
                <Table colour='#fcc' title={toPerc(fossil) + ' Fossil Fuel'}>
                    <>
                        <Row type="carbon" value={latestData.carbon}/>
                        <Row type="gas" value={latestData.gas}/>
                        <Row type="cogen" value={latestData.cogen}/>
                    </>
                </Table>
                <Table colour='#aaf' title={toPerc(clean) + ' Other Sources'}>
                    <>
                        <Row type="nuclear" value={latestData.nuclear}/>
                        <Row type="thermal" value={latestData.thermal}/>
                    </>
                </Table>
                <Table colour='#ccc' title={toPerc(Math.abs(latestData.inter)) + ' Interconnector'}>
                    <Row type="inter" value={latestData.inter}/>
                </Table>
                <Table colour='#cfc' title={'Battery storage'}>
                    <>
                        <Row type="bat" value={latestData.bat}/>
                        <Row type="consBat" value={latestData.consBat}/>
                    </>
                </Table>
            </div>
            <div className="col">
                <Card title="Battery charge / discharge (MW) today">
                    <Battery />
                </Card>
                <Card title="Battery charge / discharge (MWh) by day" margin='mt-2'>
                    <BatteryDaily />
                </Card>
            </div>
        </div>
        </>
    );
}
