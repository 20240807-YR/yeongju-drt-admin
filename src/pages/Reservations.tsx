import ReservationTable from '../components/tables/ReservationTable'
import { reservationData } from '../data/mockData'
import type { Reservation } from '../data/mockData'

export default function Reservations({ reservations = reservationData }: { reservations?: Reservation[] }) {
  const summary = [
    { label: '전체', value: reservations.length, color: '#6b7280' },
    { label: '예약', value: reservations.filter((r) => r.status === '예약').length, color: '#2563eb' },
    { label: '운행중', value: reservations.filter((r) => r.status === '운행중').length, color: '#35C8B4' },
    { label: '완료', value: reservations.filter((r) => r.status === '완료').length, color: '#16a34a' },
    { label: '취소', value: reservations.filter((r) => r.status === '취소').length, color: '#dc2626' },
  ]
  return (
    <div className="p-6 space-y-5">
      {/* Summary chips */}
      <div className="flex gap-3">
        {summary.map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl px-5 py-3 shadow-sm border border-gray-50 flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-gray-500">{label}</span>
            <span className="text-lg font-bold text-gray-800">{value}</span>
            <span className="text-xs text-gray-400">건</span>
          </div>
        ))}
      </div>

      {/* Full table */}
      <ReservationTable showFilter={true} data={reservations} />
    </div>
  )
}
