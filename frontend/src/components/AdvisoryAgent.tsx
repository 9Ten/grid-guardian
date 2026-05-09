// frontend/src/components/AdvisoryAgent.tsx
import React from 'react';
import styles from './AdvisoryAgent.module.css';

export const AdvisoryAgent: React.FC = () => {
    const reasoningSteps = [
        "Load peak confirmed at 14.0 MW (19:00)",
        "Grid import capped at 4.0 MW (Mainland bottleneck)",
        "Diesel gensets ramped to 6.5 MW to bridge deficit",
        "BESS discharging 3.5 MW; SoC projected 37% by 22:00"
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
                    <button className={styles.modifyButton}>
                        MODIFY PLAN
                    </button>
                </div>
            </div>

            <div className={styles.section}>
                <h3 className={styles.title}>Ask Agent</h3>
                <div className={styles.chatInterface}>
                    <div className={styles.chatPrompt}>
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
