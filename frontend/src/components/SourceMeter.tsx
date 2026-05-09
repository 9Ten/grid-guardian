import React from 'react';
import styles from './SourceMeter.module.css';

interface SourceMeterProps {
  label: string;
  value: string;
  percentage: number;
  color: string;
}

export const SourceMeter: React.FC<SourceMeterProps> = ({ label, value, percentage, color }) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{value}</span>
      </div>
      <div className={styles.track}>
        <div 
          className={styles.fill} 
          style={{ 
            width: `${Math.min(100, Math.max(0, percentage))}%`,
            backgroundColor: color 
          }} 
        />
      </div>
    </div>
  );
};
