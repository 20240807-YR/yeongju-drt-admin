import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  BarChart2,
  ClipboardList,
  Map,
  Settings,
  Bus,
  LogOut,
} from 'lucide-react'
import type { AdminUser } from '../../services/auth'

const navItems = [
  { to: '/',             icon: LayoutDashboard, label: '개요' },
  { to: '/demand',       icon: BarChart2,       label: '수요 분석' },
  { to: '/reservations', icon: ClipboardList,   label: '예약 현황' },
  { to: '/map',          icon: Map,             label: '노선 지도' },
  { to: '/settings',     icon: Settings,        label: '운영 설정' },
]

type SidebarProps = {
  user: AdminUser
  onLogout: () => void
}

export default function Sidebar({ user, onLogout }: SidebarProps) {
  return (
    <aside className="w-60 flex-shrink-0 flex flex-col h-full"
      style={{ background: 'linear-gradient(160deg, #35C8B4 0%, #2aaa99 100%)' }}>

      {/* Brand */}
      <div className="px-6 py-6 border-b border-white/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Bus size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">영주 관광 DRT</p>
            <p className="text-white/60 text-xs">관리자 대시보드</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="text-white/40 text-xs font-medium px-3 mb-2 tracking-wider uppercase">Menu</p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-white text-menthe shadow-sm'
                  : 'text-white/80 hover:bg-white/15 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={isActive ? 'text-menthe' : 'text-white/70'} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom info */}
      <div className="px-5 py-5 border-t border-white/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
            {user.name.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-xs font-semibold truncate">{user.name}</p>
            <p className="text-white/50 text-xs truncate">{user.department}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 transition"
            aria-label="로그아웃"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
