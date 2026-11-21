import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import { Line } from 'react-chartjs-2';
import { useQuery } from 'react-query';
import { chartOptions } from '../shared/chartOptions';
import { fetchBatteryByDay } from '../shared/requests';
import { queryOptions } from '../shared/queryOptions';

interface BatteryPoint {
  date: string;
  bat: number;
  consBat: number;
}

export const BatteryDaily = () => {
  const { isLoading, data } = useQuery<BatteryPoint[]>(
    ['batteryByDay'],
    () => fetchBatteryByDay(365),
    queryOptions
  );

  const chartData = useMemo(() => {
    if (!data) return null;

    // The API returns newest first
    const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));


    return {
      labels: sorted.map((d) => d.date.split(' ')[1] ?? d.date),
      datasets: [
        {
          label: 'Discharge (MWh)',
          data: sorted.map((d) => d.bat),
          borderColor: '#080',
          backgroundColor: 'rgba(136, 255, 136, 0.4)',
          fill: true,
          tension: 0.3,
          borderWidth: 1.5,
        },
        {
          label: 'Charge (MWh)',
          // charging is shown as negative so it plots below the axis
          data: sorted.map((d) => d.consBat),
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

  const options = chartOptions({ hideTitle: true, unit: 'MWh' });
  options.plugins.legend.display = true;

  return (
    <Line options={options} data={chartData} />
  );
};
