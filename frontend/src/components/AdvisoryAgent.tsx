// frontend/src/components/AdvisoryAgent.tsx
import React from 'react';
import styles from './AdvisoryAgent.module.css';

export const AdvisoryAgent: React.FC = () => {
    const reasoningSteps = [
        "Grid demand peaked at 2,050 kW (17:42)",
        "Solar PV output declining (-15% per 10m)",
        "BESS discharge initialized at 310 kW to offset spike",
        "Diesel Generator #2 standby active for contingency"
    ];

    return (
        <div className={styles.container}>
            <div className={styles.section}>
                <h3 className={styles.title}>Reasoning Chain</h3>
                <ul className={styles.reasoningList}>
                    {reasoningSteps.map((step, i) => (
                        <li key={i} className={styles.reasoningItem}>
                            <span className={styles.stepNumber}>{i + 1}.</span>
                            <span>{step}</span>
                        </li>
                    ))}
                </ul>
            </div>
            
            <div className={styles.section}>
                <h3 className={styles.title}>Actions</h3>
                <div className={styles.actions}>
                    <button className={styles.approveButton}>
                        APPROVE DISPATCH
                    </button>
                    <button style={{ 
                        background: 'transparent', 
                        border: '1px solid var(--border)',
                        color: 'var(--text-main)',
                        padding: '8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                    }}>
                        MODIFY PLAN
                    </button>
                </div>
            </div>

            <div className={styles.section}>
                <h3 className={styles.title}>Ask Agent</h3>
                <div className={styles.chatInterface}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        "Why is DG#2 on standby?"
                    </div>
                    <input 
                        type="text" 
                        placeholder="Ask about optimization logic..." 
                        className={styles.chatInput}
                    />
                </div>
            </div>
        </div>
    );
};
