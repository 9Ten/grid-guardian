import Header from './components/Header'
import AlertStrip from './components/AlertStrip'

export default function App() {
  return (
    <div className="min-h-screen" style={{ background: '#060d1a', color: '#cce8ff' }}>
      <Header />
      <AlertStrip />
    </div>
  )
}
