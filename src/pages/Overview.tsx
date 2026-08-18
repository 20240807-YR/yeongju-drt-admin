import { Users, TrendingUp, Bus, Calendar, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import KpiCard from '../components/cards/KpiCard'
import HourlyDemandChart from '../components/charts/HourlyDemandChart'
import WeeklyPatternChart from '../components/charts/WeeklyPatternChart'
import MonthlySeasonChart from '../components/charts/MonthlySeasonChart'
import RegionHeatmap from '../components/charts/RegionHeatmap'
import ForecastChart from '../components/charts/ForecastChart'
import ReservationTable from '../components/tables/ReservationTable'
import { kpiData, reservationData, type Reservation } from '../data/mockData'

export default function Overview({ reservations = reservationData }: { reservations?: Reservation[] }) {
  return (
    <div className="p-6 space-y-5">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          title="오늘 총 탑승"
          value={kpiData.todayRides}
          unit="명"
          delta={kpiData.todayRidesDelta}
          deltaLabel="어제 대비"
          icon={Users}
          accentColor="#35C8B4"
        />
        <KpiCard
          title="평균 탑승률"
          value={kpiData.occupancyRate}
          unit="%"
          delta={kpiData.occupancyDelta}
          deltaLabel="전주 대비"
          icon={TrendingUp}
          accentColor="#A4CF4A"
        />
        <KpiCard
          title="운행 차량"
          value={`${kpiData.activeVehicles} / ${kpiData.totalVehicles}`}
          unit="대"
          sub="활성 / 전체"
          icon={Bus}
          accentColor="#35C8B4"
        />
        <KpiCard
          title="이번 달 누적"
          value={kpiData.monthlyTotal.toLocaleString()}
          unit="명"
          delta={kpiData.monthlyDelta}
          deltaLabel="전월 대비"
          icon={Calendar}
          accentColor="#A4CF4A"
        />
      </div>

      {/* Main charts row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <HourlyDemandChart />
        </div>
        <div className="col-span-1">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 h-full">
            <h3 className="text-sm font-bold text-gray-800 mb-4">권역별 수요 비중</h3>
            <div className="space-y-3">
              {[
                { label: '북부권', sub: '소수서원 · 부석사', pct: 57, color: '#35C8B4' },
                { label: '시내권', sub: '영주 · 풍기',       pct: 31, color: '#A4CF4A' },
                { label: '남부권', sub: '무섬마을',           pct: 12, color: '#C2F2E4' },
              ].map(({ label, sub, pct, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <div>
                      <span className="font-semibold text-gray-700">{label}</span>
                      <span className="text-gray-400 ml-1">{sub}</span>
                    </div>
                    <span className="font-bold" style={{ color }}>{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-gray-50">
              <p className="text-xs text-gray-500 font-medium mb-1">핵심 인사이트</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                북부권 수요가 전체의 50~60%를 차지하며, 노선 설계는 북부권 중심으로 구성해야 합니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <RegionHeatmap />

      {/* ★ 향후 30일 관광 수요 예측 (한국관광공사 실시간 API) */}
      <ForecastChart />

      {/* Bottom row */}
      <div className="grid grid-cols-2 gap-4">
        <WeeklyPatternChart />
        <MonthlySeasonChart />
      </div>

      {/* Recent reservations */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-700">최근 예약 현황</h2>
          <Link
            to="/reservations"
            className="flex items-center gap-1 text-xs text-menthe font-medium hover:underline"
          >
            전체 보기 <ArrowRight size={13} />
          </Link>
        </div>
        <ReservationTable limit={5} showFilter={false} data={reservations} />
      </div>
    </div>
  )
}
