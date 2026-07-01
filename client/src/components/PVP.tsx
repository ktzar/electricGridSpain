import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import { Bar } from 'react-chartjs-2';
import { useQuery } from 'react-query';
import { chartOptions } from '../shared/chartOptions';
import { fetchHourlyPvp } from '../shared/requests';
import { queryOptions } from '../shared/queryOptions';

interface PvpData {
  hour: string;
  pvpc: number;
}

export const PVP = () => {
  const { isLoading, data } = useQuery<PvpData[]>('hourlyPvp', fetchHourlyPvp, queryOptions);

  const hourlyData = useMemo(() => {
    if (!data) return null;

    const pvpc = data.map((d) => d.pvpc);
    const max = Math.max(...pvpc);
    const min = Math.min(...pvpc);

    const lowThreshold = min + (max - min) * 0.25;
    const highThreshold = min + (max - min) * 0.75;

    const colors: string[] = [];
    const borderColors: string[] = [];

    // Combine color calculations into a single loop
    pvpc.forEach((price) => {
      if (price < lowThreshold) {
        colors.push('#8f8');
        borderColors.push('#080');
      } else if (price < highThreshold) {
        colors.push('#ff8');
        borderColors.push('#880');
      } else {
        colors.push('#f88');
        borderColors.push('#800');
      }
    });

    // Generate labels cleanly without external state mutations
    const labels = data.map((d, index) => {
      const currentDay = d.hour.split(' ')[0];
      const previousDay = index > 0 ? data[index - 1].hour.split(' ')[0] : '';
      const timeFormat = d.hour + ':00';

      return currentDay !== previousDay
        ? dayjs(timeFormat).format('dd-HH') + 'h'
        : dayjs(timeFormat).format('HH') + 'h';
    });

    return {
      labels,
      datasets: [
        {
          label: 'PVPC (€)',
          data: pvpc,
          fill: false,
          tension: 0.3,
          backgroundColor: colors,
          borderColor: borderColors,
          borderWidth: 1.5,
        },
      ],
    };
  }, [data]);

  if (isLoading || !data) return <h2>Loading...</h2>;

  return (
    <div className="card">
      <div className="card-header">Consumer price (€/MWh) 72h</div>
      <div className="card-body">
        {hourlyData && (
          <Bar 
            options={chartOptions({ title: '', unit: '€/MWh', max: 0, displayXAxis: true })} 
            data={hourlyData} 
          />
        )}
      </div>
    </div>
  );
};
