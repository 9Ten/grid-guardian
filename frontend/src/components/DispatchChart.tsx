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
  const labels = ['17:00', '17:15', '17:30', '17:45', '18:00', '18:15', '18:30'];
  
  const data: ChartData<'line'> = {
    labels,
    datasets: [
      {
        label: 'Actual Load',
        data: [1850, 1920, 2010, 1980, 2100, 2250, 2310],
        borderColor: '#5B2D8E', // var(--pea-purple)
        backgroundColor: 'rgba(91, 45, 142, 0.1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Load Forecast',
        data: [1900, 1950, 2050, 2150, 2250, 2350, 2450],
        borderColor: '#2D3436', // var(--text-main)
        borderDash: [5, 5],
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 0,
      },
      {
        label: 'Grid Limit',
        data: [2000, 2000, 2000, 2000, 2000, 2000, 2000],
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
        beginAtZero: false,
        title: {
          display: true,
          text: 'Power (kW)',
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
