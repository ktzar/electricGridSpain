import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { colours } from '../shared/colours'

export const EnergyLineChart = ({series, xAxis}) => {
    const lineProps = {
        strokeWidth: 1,
        dot: false
    }

    return (
        <LineChart
            width={500}
            height={300}
            data={series}
            margin={{
                top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
            }}
                    >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={xAxis} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="solarpv" stroke={colours.solarpv} {...lineProps} />
                <Line type="monotone" dataKey="solarthermal" stroke={colours.solarthermal} {...lineProps} />
                <Line type="monotone" dataKey="wind" stroke={colours.wind} {...lineProps} />
                <Line type="monotone" dataKey="gas" stroke={colours.gas} {...lineProps} />
                <Line type="monotone" dataKey="carbon" stroke={colours.carbon} {...lineProps} />
                <Line type="monotone" dataKey="nuclear" stroke={colours.nuclear} {...lineProps} />
                <Line type="monotone" dataKey="hidro" stroke={colours.hidro} {...lineProps} />
                <Line type="monotone" dataKey="thermal" stroke={colours.thermal} {...lineProps} />
                <Line type="monotone" dataKey="cogen" stroke={colours.cogen} {...lineProps} />
            </LineChart>
    )
}
