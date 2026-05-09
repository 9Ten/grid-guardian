// frontend/src/App.tsx
import { DashboardLayout } from './components/DashboardLayout';

function App() {
  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ 
        background: 'var(--pea-purple)', 
        color: 'white', 
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        height: '64px',
        boxSizing: 'border-box',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: 10
      }}>
        <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, letterSpacing: '0.5px' }}>
          PEA EMS — KOH TAO <span style={{ opacity: 0.7, fontSize: '0.875rem', marginLeft: '12px', fontWeight: 400 }}>GRID GUARDIAN</span>
        </h1>
      </header>
      <DashboardLayout />
    </div>
  )
}

export default App;
