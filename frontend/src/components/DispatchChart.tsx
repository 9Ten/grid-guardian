import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import type { ChartOptions, ChartData } from 'chart.js';
import { Line } from 'react-chartjs-2';
import styles from './DispatchChart.module.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export const DispatchChart: React.FC = () => {
  const labels = [
    '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', 
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', 
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', 
    '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
  ];
  
  const data: ChartData<'line'> = {
    labels,
    datasets: [
      {
        label: 'Actual Load',
        data: [
          8.1, 7.9, 7.4, 7.2, 7.3, 7.9, 8.9, 10.1, 11.0, 11.9, 
          12.1, 11.9, 11.6, 11.1, 10.4, 10.1, 10.9, 12.8, 13.5, 14.0, 
          13.8, 12.5, 10.4, 9.1
        ],
        borderColor: '#5B2D8E', // var(--pea-purple)
        backgroundColor: 'rgba(91, 45, 142, 0.1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Load Forecast',
        data: [
          8.2, 7.8, 7.5, 7.3, 7.2, 7.8, 8.8, 10.0, 11.2, 11.8, 
          12.0, 12.0, 11.5, 11.0, 10.5, 10.2, 10.8, 11.8, 13.0, 14.0, 
          13.5, 12.5, 10.5, 9.2
        ],
        borderColor: '#2D3436', // var(--text-main)
        borderDash: [5, 5],
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 0,
      },
      {
        label: 'Grid Limit',
        data: [
          4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 12.0, 12.0, 
          12.0, 12.0, 12.0, 12.0, 12.0, 12.0, 4.0, 4.0, 4.0, 4.0, 
          4.0, 4.0, 4.0, 4.0
        ],
        borderColor: '#C0392B', // var(--color-shed)
        borderDash: [2, 2],
        borderWidth: 2,
        pointRadius: 0,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 11
          }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Power (MW)',
          font: {
            size: 12
          }
        },
        grid: {
          color: '#E0E0E0',
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
  };

  return (
    <div className={styles.container}>
      <Line options={options} data={data} />
    </div>
  );
};
