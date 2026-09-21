import type { Reservation } from '../data/mockData'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export async function fetchReservations(accessToken?: string): Promise<Reservation[]> {
  if (!url || !key) throw new Error('관리자 Supabase 환경변수가 없습니다.')
  if (!accessToken) throw new Error('관리자 로그인 세션이 없습니다. 다시 로그인해 주세요.')

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 8000)
  let response: Response
  try {
    response = await fetch(`${url}/rest/v1/reservations?select=*&order=scheduled_at.desc`, {
      cache: 'no-store',
      headers: { apikey: key, Authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('예약 서버 응답이 없습니다. 잠시 후 다시 시도해 주세요.')
    }
    throw new Error('예약 서버에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요.')
  } finally {
    window.clearTimeout(timeout)
  }
  if (!response.ok) throw new Error(`예약 정보를 불러오지 못했습니다. (${response.status})`)
  const rows = await response.json()
  return rows.map((row: any) => {
    const date = new Date(row.scheduled_at)
    const validDate = Number.isNaN(date.getTime()) ? new Date() : date
    const statusMap: Record<string, Reservation['status']> = { requested: '대기', confirmed: '예약', boarding: '운행중', completed: '완료', cancelled: '취소' }
    return { id: String(row.id).slice(0, 8), date: validDate.toLocaleDateString('ko-KR'), time: validDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }), departure: row.departure || '-', destination: row.destination || '-', passengers: Number(row.passengers) || 0, status: statusMap[row.status] || '대기' }
  })
}
