import { useState } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, Download } from 'lucide-react'
import { reservationData, Reservation, ReservationStatus } from '../../data/mockData'
import { downloadCSV } from '../../utils/csvDownload'

const statusStyle: Record<ReservationStatus, { bg: string; text: string; label: string }> = {
  완료:   { bg: '#f0fdf4', text: '#16a34a', label: '완료' },
  운행중: { bg: '#f0fdfa', text: '#35C8B4', label: '운행중' },
  예약:   { bg: '#eff6ff', text: '#2563eb', label: '예약' },
  대기:   { bg: '#fffbeb', text: '#d97706', label: '대기' },
  취소:   { bg: '#fef2f2', text: '#dc2626', label: '취소' },
}

type SortKey = keyof Reservation
type SortDir = 'asc' | 'desc' | null

interface Props {
  limit?: number
  showFilter?: boolean
  data?: Reservation[]
}

export default function ReservationTable({ limit, showFilter = true, data = reservationData }: Props) {
  const [filter, setFilter] = useState<string>('전체')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)
  const pageSize = limit ?? 8

  const statuses: string[] = ['전체', '예약', '운행중', '완료', '대기', '취소']

  const filtered = [...data]
    .filter((r) => filter === '전체' || r.status === filter)
    .filter((r) =>
      search === '' ||
      r.id.includes(search) ||
      r.departure.includes(search) ||
      r.destination.includes(search)
    )
    .sort((a, b) => {
      if (!sortDir) return 0
      const av = a[sortKey], bv = b[sortKey]
      const cmp = String(av).localeCompare(String(bv), 'ko')
      return sortDir === 'asc' ? cmp : -cmp
    })

  const total = filtered.length
  const paginated = limit ? filtered.slice(0, limit) : filtered.slice((page - 1) * pageSize, page * pageSize)
  const totalPages = Math.ceil(total / pageSize)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ChevronsUpDown size={12} className="text-gray-300 ml-1" />
    if (sortDir === 'asc') return <ChevronUp size={12} className="text-menthe ml-1" />
    if (sortDir === 'desc') return <ChevronDown size={12} className="text-menthe ml-1" />
    return <ChevronsUpDown size={12} className="text-gray-300 ml-1" />
  }

  const cols: { key: SortKey; label: string }[] = [
    { key: 'id',          label: '예약번호' },
    { key: 'date',        label: '날짜' },
    { key: 'time',        label: '시간' },
    { key: 'departure',   label: '출발지' },
    { key: 'destination', label: '목적지' },
    { key: 'passengers',  label: '인원' },
    { key: 'status',      label: '상태' },
  ]

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
      {showFilter && (
        <div className="px-5 py-4 border-b border-gray-50 flex flex-wrap items-center gap-3">
          <div>
            <h3 className="text-sm font-bold text-gray-800">예약 현황</h3>
            <p className="text-xs text-gray-400">총 {total}건</p>
          </div>
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            {/* Search */}
            <input
              type="text"
              placeholder="번호 · 출발 · 목적지 검색"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-menthe w-44"
            />
            {/* Status filter */}
            <div className="flex gap-1">
              {statuses.map((s) => (
                <button
                  key={s}
                  onClick={() => { setFilter(s); setPage(1) }}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-all font-medium ${
                    filter === s
                      ? 'bg-menthe text-white'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {/* CSV 다운로드 */}
            <button
              onClick={() => {
                const headers = ['예약번호', '날짜', '시간', '출발지', '목적지', '인원', '상태']
                const rows = filtered.map((r) => [
                  r.id, r.date, r.time, r.departure, r.destination, r.passengers, r.status,
                ])
                const label = filter === '전체' ? '전체' : filter
                downloadCSV(`DRT_예약현황_${label}_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows)
              }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-menthe hover:text-white transition-all font-medium"
            >
              <Download size={13} />
              CSV
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50">
              {cols.map(({ key, label }) => (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  className="text-left text-xs font-semibold text-gray-400 px-5 py-3 cursor-pointer hover:text-gray-600 select-none whitespace-nowrap"
                >
                  <span className="flex items-center">
                    {label}
                    <SortIcon k={key} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((row, i) => {
              const s = statusStyle[row.status]
              return (
                <tr
                  key={row.id}
                  className={`border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${
                    i % 2 === 0 ? '' : 'bg-gray-50/30'
                  }`}
                >
                  <td className="px-5 py-3 text-xs font-mono text-gray-500">{row.id}</td>
                  <td className="px-5 py-3 text-xs text-gray-600">{row.date}</td>
                  <td className="px-5 py-3 text-xs font-medium text-gray-700">{row.time}</td>
                  <td className="px-5 py-3 text-xs text-gray-700">{row.departure}</td>
                  <td className="px-5 py-3 text-xs text-gray-700 font-medium">{row.destination}</td>
                  <td className="px-5 py-3 text-xs text-center">
                    <span className="font-semibold text-gray-700">{row.passengers}</span>
                    <span className="text-gray-400 ml-0.5">명</span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: s.bg, color: s.text }}
                    >
                      {s.label}
                    </span>
                  </td>
                </tr>
              )
            })}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-sm text-gray-400 py-10">
                  검색 결과가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!limit && totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50">
          <span className="text-xs text-gray-400">{total}건 중 {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)}건</span>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
                  p === page ? 'bg-menthe text-white' : 'text-gray-400 hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
