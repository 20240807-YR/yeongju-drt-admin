import { reservationData, type Reservation } from '../data/mockData'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export async function fetchReservations(accessToken?: string): Promise<Reservation[]> {
  if (!url || !key || !accessToken) return []
  const response = await fetch(`${url}/rest/v1/reservations?select=*&order=scheduled_at.desc`, {
    headers: { apikey: key, Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) throw new Error(`예약 정보를 불러오지 못했습니다. (${response.status})`)
  const rows = await response.json()
  return rows.map((row: any) => {
    const date = new Date(row.scheduled_at)
    const statusMap: Record<string, Reservation['status']> = { requested: '대기', confirmed: '예약', boarding: '운행중', completed: '완료', cancelled: '취소' }
    return { id: String(row.id).slice(0, 8), date: date.toLocaleDateString('ko-KR'), time: date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }), departure: row.departure, destination: row.destination, passengers: Number(row.passengers), status: statusMap[row.status] || '대기' }
  })
}
