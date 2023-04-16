import dayjs from 'dayjs';
import formatAmount from '../shared/formatAmount';
import { useQuery } from 'react-query'
import { fetchRecords } from '../shared/requests';
import { queryOptions } from '../shared/queryOptions';
import { SourceIndicator } from './SourceIndicator';

const formatDate = 'DD/MMM/YY @ HH:mm'

export default () => {
    const { isLoading, error, data } = useQuery('renewablesRecord', fetchRecords, queryOptions)

    if (isLoading) {
        return <span>Loading...</span>
    }

    return (
        <>
            <div className="row">
                <div className="col">
                <div className="card">
                  <div className="card-header">Renewables Production Record</div>
                  <div className="card-body">
                    <table className="table table-bordered">
                        <tbody>
                            <tr>
                                <td><SourceIndicator type='solarpv' title={'Solar'} /></td>
                                <td>{formatAmount(data.solarpvValue)} GW</td>
                                <td>{ dayjs(data.solarpvTime).format(formatDate)}</td>
                            </tr>
                            <tr>
                                <td><SourceIndicator type='wind' title={'Wind'} /></td>
                                <td>{formatAmount(data.windValue)} GW</td>
                                <td>{dayjs(data.windTime).format(formatDate)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                </div>
                </div>
            </div>
        </>
    )
}