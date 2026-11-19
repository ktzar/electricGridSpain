import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import { Line } from 'react-chartjs-2';
import { useQuery } from 'react-query';
import { chartOptions } from '../shared/chartOptions';
import { fetchInstantByDay } from '../shared/requests';
import { queryOptions } from '../shared/queryOptions';

interface BatteryPoint {
  time: string;
  bat: number;
  consBat: number;
}

export const Battery = () => {
  const day = dayjs().format('YYYY-MM-DD');
  const { isLoading, data } = useQuery<BatteryPoint[]>(
    ['batteryByDay', day],
    () => fetchInstantByDay(day),
    queryOptions
  );

  const chartData = useMemo(() => {
    if (!data) return null;

    // The API returns newest first
    const sorted = [...data].sort((a, b) => a.time.localeCompare(b.time));

    return {
      labels: sorted.map((d) => d.time.split(' ')[1] ?? d.time),
      datasets: [
        {
          label: 'Discharge (MW)',
          data: sorted.map((d) => d.bat),
          borderColor: '#080',
          backgroundColor: 'rgba(136, 255, 136, 0.4)',
          fill: true,
          tension: 0.3,
          borderWidth: 1.5,
        },
        {
          label: 'Charge (MW)',
          // charging is shown as negative so it plots below the axis
          data: sorted.map((d) => -Math.abs(d.consBat)),
          borderColor: '#c60',
          backgroundColor: 'rgba(255, 170, 100, 0.4)',
          fill: true,
          tension: 0.3,
          borderWidth: 1.5,
        },
      ],
    };
  }, [data]);

  if (isLoading) return <h2>Loading...</h2>;
  if (!chartData) return <div>Error loading data</div>;

  const options = chartOptions({ title: '', unit: 'MW', min: 0, max: 0, displayXAxis: true });
  options.plugins.legend.display = true;

  return (
    <div className="card mt-2">
      <div className="card-header">Battery charge / discharge (MW) today</div>
      <div className="card-body">
        <Line options={options} data={chartData} />
      </div>
    </div>
  );
};
