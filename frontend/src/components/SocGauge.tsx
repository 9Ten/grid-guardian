import React from 'react';
import styles from './SocGauge.module.css';

interface SocGaugeProps {
  percentage: number;
}

export const SocGauge: React.FC<SocGaugeProps> = ({ percentage }) => {
  // Ensure percentage is between 0 and 100
  const p = Math.min(100, Math.max(0, percentage));
  
  return (
    <div className={styles.wrapper}>
      <div className={styles.label}>BESS STATE OF CHARGE</div>
      <div className={styles.gaugeContainer}>
        <div 
          className={styles.gauge} 
          style={{ '--soc-p': `${p}%` } as React.CSSProperties}
        >
          <div className={styles.gaugeInner}>
            <span className={styles.percentageValue}>{p}%</span>
          </div>
          {/* Safety Markers */}
          <div className={styles.marker} style={{ transform: 'rotate(72deg)' }} title="20% Limit"></div>
          <div className={styles.marker} style={{ transform: 'rotate(324deg)' }} title="90% Limit"></div>
        </div>
      </div>
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={styles.dot} style={{ backgroundColor: '#E74C3C' }}></span>
          <span>Critical &lt; 20%</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.dot} style={{ backgroundColor: 'var(--color-bess)' }}></span>
          <span>Optimal 20-90%</span>
        </div>
      </div>
    </div>
  );
};
