// frontend/src/components/DashboardLayout.tsx
import React from 'react';
import styles from './DashboardLayout.module.css';

export const DashboardLayout: React.FC = () => {
    return (
        <main className={styles.grid}>
            <aside className={styles.panel}>
                <h2 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>OPERATIONS STATUS</h2>
                <div style={{ flex: 1 }}>Left: Ops Status Content</div>
            </aside>
            <section className={styles.panel}>
                <h2 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>DISPATCH & ANALYTICS</h2>
                <div style={{ flex: 1 }}>Middle: Dispatch & Chart Content</div>
            </section>
            <aside className={styles.panel}>
                <h2 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>ALERTS & ECONOMY</h2>
                <div style={{ flex: 1 }}>Right: Alerts & Economy Content</div>
            </aside>
        </main>
    );
};
