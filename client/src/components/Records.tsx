import dayjs from 'dayjs';
import formatAmount from '../shared/formatAmount';
import { useQuery } from 'react-query'
import { fetchRecords, fetchRecordsV2 } from '../shared/requests';
import { queryOptions } from '../shared/queryOptions';
import { SourceIndicator } from './SourceIndicator';

const formatDate = 'DD/MMM/YY'
const formatTime = 'HH:mm'

type ARecord = {
    time: string,
    value: number
}

type EnergyRecordsProps = {
    type: string,
    data: ARecord[],
    dateFirst: boolean
}

const EnergyRecords = ({type, data, dateFirst} : EnergyRecordsProps) => {
    if (!type || !data) {
        return null;
    }
    return (
        <div className="col"><div className="card">
            <div className="card-header"><SourceIndicator type={type} /> </div>
            <div className="card-body">
            <table className="table table-bordered table-striped table-sm">
                <thead className="thead-light">
                    <tr> <th><strong>Time</strong></th> <th><strong>Value</strong></th> </tr>
                </thead>
                <tbody>
                    {data.map((row : any) => (
                        <tr key={row.time}>
                        { dateFirst ?
                        (<>
                            <td>{ dayjs(row.time).format(formatDate)}~<em>{ dayjs(row.time).format(formatTime)}</em></td>
                            <td>{formatAmount(row.value)}</td>
                        </>) : 
                        (<>
                            <td>{formatAmount(row.value)}</td>
                            <td>{ dayjs(row.time).format(formatDate)}~<em>{ dayjs(row.time).format(formatTime)}</em></td>
                        </>)}
                        </tr>
                    ))}
                </tbody>
            </table>
            </div>
        </div></div>
    );
}

export default () => {
    const { isLoading, error, data } = useQuery('renewablesRecord', fetchRecords, queryOptions)

    if (isLoading || !data) {
        return <span>Loading...</span>
    }


    return (
        <>
            <h3>Time of top records</h3>
            <div className="row">
                <p>Maximum instant power generated from a technology. Only the top value per month is shown. </p>
                <EnergyRecords dateFirst type='solarpv' data={data.maxByMonth.solar} />
                <EnergyRecords dateFirst type='wind' data={data.maxByMonth.wind} />
                <EnergyRecords dateFirst type='consBat' data={data.maxByMonth.consBat} />
                <EnergyRecords dateFirst type='bat' data={data.maxByMonth.bat} />
            </div>
            <hr/>
            <h3>Time when record was broken</h3>
            <div className="row">
                <p>Time when a specific record was broken</p>
                <EnergyRecords type='solarpv' data={data.timeByValue.solar} />
                <EnergyRecords type='wind' data={data.timeByValue.wind} />
                <EnergyRecords type='consBat' data={data.timeByValue.consBat} />
                <EnergyRecords type='bat' data={data.timeByValue.bat} />
            </div>
        </>
    )
}
