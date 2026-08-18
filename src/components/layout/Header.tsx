import { useLocation } from 'react-router-dom'
import { Bell, Search } from 'lucide-react'
import type { AdminUser } from '../../services/auth'

const titleMap: Record<string, { title: string; subtitle: string }> = {
  '/':             { title: '개요',      subtitle: '영주 관광 DRT 전체 현황' },
  '/demand':       { title: '수요 분석', subtitle: '시간대별 · 권역별 · 시즌별 수요 패턴' },
  '/reservations': { title: '예약 현황', subtitle: '실시간 예약 및 탑승 이력 관리' },
  '/map':          { title: '노선 지도', subtitle: '영주역 · 풍기역 출발 DRT 노선 시각화' },
  '/settings':     { title: '운영 설정', subtitle: '배차 및 노선 운영 파라미터' },
}

type HeaderProps = {
  user: AdminUser
}

export default function Header({ user }: HeaderProps) {
  const { pathname } = useLocation()
  const info = titleMap[pathname] ?? { title: '개요', subtitle: '' }
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  })

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 flex-shrink-0">
      <div>
        <h1 className="text-base font-bold text-gray-800">{info.title}</h1>
        <p className="text-xs text-gray-400">{info.subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <label className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 text-sm text-gray-400 focus-within:ring-2 focus-within:ring-menthe/20">
          <Search size={14} />
          <input
            className="hidden lg:block bg-transparent outline-none w-28 text-xs text-gray-600 placeholder:text-gray-400"
            placeholder="검색"
          />
        </label>

        {/* Date */}
        <span className="text-xs text-gray-400 hidden xl:block">{today}</span>

        {/* Notification */}
        <button
          type="button"
          className="relative w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
          aria-label="알림"
        >
          <Bell size={16} className="text-gray-500" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-menthe" />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ background: 'linear-gradient(135deg, #35C8B4, #A4CF4A)' }}>
          {user.name.slice(0, 1)}
        </div>
      </div>
    </header>
  )
}
