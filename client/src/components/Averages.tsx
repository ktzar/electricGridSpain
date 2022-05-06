import { PieChart, Pie, Sector, Cell, ResponsiveContainer } from 'recharts';
import { useQuery } from 'react-query'
import { colours } from '../shared/colours'

const data01 = [
      { name: 'Group A', value: 200 },
      { name: 'Group B', value: 300 },
      { name: 'Group C', value: 300 },
      { name: 'Group D', value: 200 },
];
const data02 = [
      { name: 'A1', value: 100 },
      { name: 'A2', value: 300 },
      { name: 'B1', value: 100 },
      { name: 'B2', value: 80 },
      { name: 'B3', value: 40 },
      { name: 'B4', value: 30 },
      { name: 'B5', value: 50 },
      { name: 'C1', value: 100 },
      { name: 'C2', value: 200 },
      { name: 'D1', value: 150 },
      { name: 'D2', value: 50 },
];



const options = {
      title: {
              text: 'My chart'
            },
      series: [{
              data: [1, 2, 3]
            }]
}

export default () => {
    const { isLoading: isLoadingDaily, data: dailyData } = useQuery('daily', () =>
        fetch('/api/daily').then(res => res.json())
    )
    const { isLoading: isLoadingMonthly, data: monthlyData } = useQuery('monthly', () =>
        fetch('/api/monthly').then(res => res.json())
    )
    const { isLoading: isLoadingYearly, data: yearlyData } = useQuery('yearly', () =>
        fetch('/api/yearly').then(res => res.json())
    )

    if (isLoadingYearly || isLoadingMonthly || isLoadingDaily) {
        return <div class="spinner-border" role="status">
           <span class="sr-only">Loading...</span>
       </div>
    }

    const yesterday = dailyData[1]
    const lastDayData = Object.keys(yesterday)
        .filter(k => yesterday[k] > 0 && k !== 'day')
        .map(k => ({ name: k, value: yesterday[k]}))

    const lastMonth = monthlyData[1]
    const lastMonthData = Object.keys(lastMonth)
        .filter(k => lastMonth[k] > 0 && k !== 'month')
        .map(k => ({ name: k, value: lastMonth[k]}))


    return (
        <>
        <div className="card mt-2">
          <div className="card-header">
            Averages
          </div>
          <div className="card-body">
            <div className="row">
                <div className="col">
                    <h4>Yesterday</h4>
                    <PieChart width={200} height={250}>
                        <Pie data={lastDayData} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={50} fill="#82ca9d" label >
                            {lastDayData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colours[entry.name]} />
                                         ))}
                        </Pie>
                    </PieChart>
                </div>
                <div className="col">
                    <h4>Last Month</h4>
                    <PieChart width={200} height={250}>
                        <Pie data={lastMonthData} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={50} fill="#82ca9d" label >
                            {lastMonthData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colours[entry.name]} />
                                         ))}
                        </Pie>
                    </PieChart>
                </div>
            </div>
          </div>
        </div>
        </>
    );
}
