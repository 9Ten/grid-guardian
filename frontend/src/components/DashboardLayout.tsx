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
                <h2 className={styles.panelTitle}>OPERATIONS STATUS</h2>
                <div className={styles.panelContent}>
                    <SourceMeter 
                        label="Main Grid" 
                        value="4.0 MW" 
                        percentage={25} 
                        color="var(--color-grid)" 
                    />
                    <SourceMeter 
                        label="Diesel Generators" 
                        value="6.5 MW" 
                        percentage={65} 
                        color="var(--color-diesel)" 
                    />
                    <SourceMeter 
                        label="BESS Output" 
                        value="3.5 MW" 
                        percentage={35} 
                        color="var(--color-bess)" 
                    />
                    
                    <SocGauge percentage={46} />
                </div>
            </aside>
            <section className={styles.panel}>
                <h2 className={styles.panelTitle}>DISPATCH & ANALYTICS</h2>
                <div className={styles.panelContent}>
                    <DispatchChart />
                </div>
            </section>
            <aside className={styles.panel}>
                <h2 className={styles.panelTitle}>ALERTS & ECONOMY</h2>
                <div className={styles.panelContent}>
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-shed)', fontWeight: 600, marginBottom: '4px' }}>🔴 CRITICAL BOTTLENECK</div>
                        <div style={{ fontSize: '0.875rem' }}>Mainland cable hitting 4.0 MW hard cap. Spinning reserve at 12%.</div>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--pea-gold)', fontWeight: 600, marginBottom: '4px' }}>⚠️ DG START AUTHORIZED</div>
                        <div style={{ fontSize: '0.875rem' }}>Synchronize Diesel Gen #1 by 17:45 to avoid BESS depletion.</div>
                    </div>
                    <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px' }}>ECONOMY SNAPSHOT</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '0.875rem' }}>System Cost</span>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>฿114,000 / day</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.875rem' }}>Carbon Intensity</span>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>420 g/kWh</span>
                        </div>
                    </div>
                </div>
            </aside>

            <section className={`${styles.panel} ${styles.bottomPanel}`}>
                <h2 className={styles.panelTitle}>ADVISORY AGENT</h2>
                <AdvisoryAgent />
            </section>
        </main>
    );
};
