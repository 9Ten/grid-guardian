import { DashboardLayout } from './components/DashboardLayout';
import styles from './App.module.css';

function App() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          PEA EMS — KOH TAO <span className={styles.subtitle}>GRID GUARDIAN</span>
        </h1>
      </header>
      <DashboardLayout />
    </div>
  )
}

export default App;
