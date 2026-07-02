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

  const annotations = useMemo(() => {
    if (!data) return null;

    const pvpc = data.map((d) => d.pvpc);

    let previousDay = '';
    const annotations : any = {};
    const currentHour = dayjs(new Date()).format('YYYY-MM-DD HH');
    //console.log(currentHour);
    const labels = data.map((d, index) => {
      //console.log(d.hour);
      const currentDay = d.hour.split(' ')[0];

      const format = currentDay !== previousDay ? 'dd-HH' : 'HH';
      if (currentDay !== previousDay && index !== 0) {
          annotations[currentDay] = {
            type: 'line',
            xMin: index,
            xMax: index,
            borderColor: 'rgb(99, 255, 132)',
            borderWidth: 2,
          }
      }
      previousDay = currentDay;
      return '';
    });

    //console.log({annotations})

    return annotations;
  }, [data]);

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

    let previousDay = '';
    const labels = data.map((d, index) => {
      const currentDay = d.hour.split(' ')[0];
      const timeFormat = d.hour + ':00';

      const format = 'dd-HH'//currentDay !== previousDay ? 'dd-HH' : 'HH';
      previousDay = currentDay;
        return dayjs(timeFormat).format(format) + 'h';
    });

    //console.log({labels})

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

  if (isLoading || !data || !hourlyData) return <h2>Loading...</h2>;

  const options = chartOptions({ title: '', unit: '€/MWh', max: 0, displayXAxis: true }); 
  options.plugins.annotation.annotations = annotations;
  const chartData = {labels: hourlyData.labels, datasets: hourlyData.datasets};
  //console.log({options, chartData});


  return (
    <div className="card">
      <div className="card-header">Consumer price (€/MWh) 72h</div>
      <div className="card-body">
        {hourlyData && (
          <Bar 
            options={options} 
            data={chartData} 
          />
        )}
      </div>
    </div>
  );
};
