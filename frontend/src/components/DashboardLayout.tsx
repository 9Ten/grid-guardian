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
                    <div className={styles.alertItem}>
                        <div className={`${styles.alertLabel} ${styles.alertCritical}`}>🔴 CRITICAL BOTTLENECK</div>
                        <div className={styles.alertText}>Mainland cable hitting 4.0 MW hard cap. Spinning reserve at 12%.</div>
                    </div>
                    <div className={styles.alertItem}>
                        <div className={`${styles.alertLabel} ${styles.alertWarning}`}>⚠️ DG START AUTHORIZED</div>
                        <div className={styles.alertText}>Synchronize Diesel Gen #1 by 17:45 to avoid BESS depletion.</div>
                    </div>
                    <hr className={styles.divider} />
                    <div>
                        <div className={styles.economyTitle}>ECONOMY SNAPSHOT</div>
                        <div className={styles.economyRow}>
                            <span className={styles.economyLabel}>System Cost</span>
                            <span className={styles.economyValue}>฿114,000 / day</span>
                        </div>
                        <div className={styles.economyRow}>
                            <span className={styles.economyLabel}>Carbon Intensity</span>
                            <span className={styles.economyValue}>420 g/kWh</span>
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
