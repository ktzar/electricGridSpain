import dayjs from 'dayjs';
import formatAmount from '../shared/formatAmount';
import { useQuery } from 'react-query'
import { fetchRecords } from '../shared/requests';
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
    data: ARecord[]
}

const EnergyRecords = ({type, data} : EnergyRecordsProps) => (
    <div className="col"><div className="card">
        <div className="card-header"><SourceIndicator type={type} /> </div>
        <div className="card-body">
        <table className="table table-bordered">
            <thead className="thead-light">
                <tr> <th><strong>Time</strong></th> <th><strong>Value</strong></th> </tr>
            </thead>
            <tbody>
                {data.map((row : any) => (
                    <tr key={row.time}>
                        <td>{ dayjs(row.time).format(formatDate)}~<em>{ dayjs(row.time).format(formatTime)}</em></td>
                        <td>{formatAmount(row.value)} <small>GW</small></td>
                    </tr>
                ))}
            </tbody>
        </table>
        </div>
    </div></div>
)

export default () => {
    const { isLoading, error, data } = useQuery('renewablesRecord', fetchRecords, queryOptions)

    if (isLoading || !data) {
        return <span>Loading...</span>
    }

    return (
        <div className="row">
            <p>Maximum instant power generated from a technology. Only the top value per month is shown. </p>
            <EnergyRecords type='solarpv' data={data.solar} />
            <EnergyRecords type='wind' data={data.wind} />
        </div>
    )
}