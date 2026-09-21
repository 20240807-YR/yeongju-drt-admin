import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import Overview from './pages/Overview'
import DemandAnalysis from './pages/DemandAnalysis'
import Reservations from './pages/Reservations'
import Settings from './pages/Settings'
import MapView from './pages/MapView'
import Login from './pages/Login'
import { getStoredAdminUser, refreshAdminSession, signOut, type AdminUser } from './services/auth'
import { fetchReservations } from './services/reservations'
import type { Reservation } from './data/mockData'

export default function App() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => getStoredAdminUser())
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [reservationError, setReservationError] = useState('')
  const [loadingReservations, setLoadingReservations] = useState(false)
  const [hasLoadedReservations, setHasLoadedReservations] = useState(false)
  const refreshInFlight = useRef(false)
  const refreshSequence = useRef(0)

  const loadReservations = async (session = adminUser) => {
    if (!session || refreshInFlight.current) return
    refreshInFlight.current = true
    const requestId = ++refreshSequence.current
    setLoadingReservations(true)
    setReservationError('')
    try {
      let rows: Reservation[]
      try {
        rows = await fetchReservations(session.accessToken)
      } catch (error) {
        if (String(error).includes('(401)') && session.refreshToken) {
          const refreshed = await refreshAdminSession(session.refreshToken)
          setAdminUser(refreshed)
          rows = await fetchReservations(refreshed.accessToken)
        } else {
          throw error
        }
      }
      if (requestId !== refreshSequence.current) return
      setReservations(rows)
      setHasLoadedReservations(true)
    } catch (error) {
      if (requestId !== refreshSequence.current) return
      const message = error instanceof Error ? error.message : '예약 정보를 불러오지 못했습니다.'
      setReservationError(message)
      if (message.includes('(401)') || message.includes('세션이 만료')) {
        signOut()
        setAdminUser(null)
      }
    } finally {
      if (requestId === refreshSequence.current) {
        setLoadingReservations(false)
        refreshInFlight.current = false
      }
    }
  }

  useEffect(() => {
    if (!adminUser) return undefined

    void loadReservations()

    const refreshTimer = window.setInterval(() => {
      void loadReservations()
    }, 10000)

    return () => window.clearInterval(refreshTimer)
  }, [adminUser])

  const handleLogout = () => {
    signOut()
    refreshSequence.current += 1
    refreshInFlight.current = false
    setAdminUser(null)
    setReservations([])
    setReservationError('')
    setHasLoadedReservations(false)
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
            {((loadingReservations && !hasLoadedReservations) || reservationError) && (
              <div className="mx-6 mt-4 flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm shadow-sm">
                <span className={reservationError ? 'text-red-600' : 'text-gray-500'}>
                  {reservationError || '예약 정보를 불러오는 중입니다...'}
                </span>
                {reservationError && (
                  <button type="button" onClick={() => void loadReservations()} className="rounded-lg bg-menthe px-3 py-1.5 text-xs font-semibold text-white">
                    다시 시도
                  </button>
                )}
              </div>
            )}
            <Routes>
              <Route path="/"             element={<Overview reservations={reservations} />} />
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
