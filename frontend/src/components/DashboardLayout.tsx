// frontend/src/components/DashboardLayout.tsx
import React from 'react';
import styles from './DashboardLayout.module.css';
import { SourceMeter } from './SourceMeter';
import { SocGauge } from './SocGauge';
import { DispatchChart } from './DispatchChart';
import { AdvisoryAgent } from './AdvisoryAgent';

export const DashboardLayout: React.FC = () => {
    return (
        <main className={styles.grid}>
            <aside className={styles.panel}>
                <h2 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>OPERATIONS STATUS</h2>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <SourceMeter 
                        label="Main Grid" 
                        value="1,240 kW" 
                        percentage={62} 
                        color="var(--color-grid)" 
                    />
                    <SourceMeter 
                        label="Diesel Generators" 
                        value="450 kW" 
                        percentage={22} 
                        color="var(--color-diesel)" 
                    />
                    <SourceMeter 
                        label="BESS Output" 
                        value="310 kW" 
                        percentage={15} 
                        color="var(--color-bess)" 
                    />
                    
                    <SocGauge percentage={74} />
                </div>
            </aside>
            <section className={styles.panel}>
                <h2 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>DISPATCH & ANALYTICS</h2>
                <div style={{ flex: 1 }}>
                    <DispatchChart />
                </div>
            </section>
            <aside className={styles.panel}>
                <h2 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>ALERTS & ECONOMY</h2>
                <div style={{ flex: 1 }}>Right: Alerts & Economy Content</div>
            </aside>

            <section className={`${styles.panel} ${styles.bottomPanel}`}>
                <h2 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>ADVISORY AGENT</h2>
                <AdvisoryAgent />
            </section>
        </main>
    );
};
