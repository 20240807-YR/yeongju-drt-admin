import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import Overview from './pages/Overview'
import DemandAnalysis from './pages/DemandAnalysis'
import Reservations from './pages/Reservations'
import Settings from './pages/Settings'
import MapView from './pages/MapView'
import Login from './pages/Login'
import { getStoredAdminUser, signOut, type AdminUser } from './services/auth'
import { useEffect } from 'react'
import { fetchReservations } from './services/reservations'
import type { Reservation } from './data/mockData'

export default function App() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => getStoredAdminUser())
  const [reservations, setReservations] = useState<Reservation[]>([])

  useEffect(() => {
    if (!adminUser) return
    fetchReservations((adminUser as AdminUser & { accessToken?: string }).accessToken)
      .then(setReservations)
      .catch(() => setReservations([]))
  }, [adminUser])

  const handleLogout = () => {
    signOut()
    setAdminUser(null)
  }

  if (!adminUser) {
    return <Login onLogin={setAdminUser} />
  }

  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar user={adminUser} onLogout={handleLogout} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header user={adminUser} />
          <main className="flex-1 overflow-y-auto" style={{ background: '#f0f8f5' }}>
            <Routes>
              <Route path="/"             element={<Overview />} />
              <Route path="/demand"       element={<DemandAnalysis />} />
              <Route path="/reservations" element={<Reservations reservations={reservations} />} />
              <Route path="/map"          element={<MapView />} />
              <Route path="/settings"     element={<Settings />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}
