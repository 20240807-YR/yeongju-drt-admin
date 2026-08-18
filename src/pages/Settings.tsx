import { useMemo, useState } from 'react'
import { Clock3, Plus, Route, Save, Settings as SettingsIcon, ToggleLeft, ToggleRight } from 'lucide-react'

const INTERVALS = [5, 10, 15, 20]

const INITIAL_ROUTES = [
  { id: 'north-1', group: '북부권 노선', name: '영주역 ↔ 소수서원', active: true },
  { id: 'north-2', group: '북부권 노선', name: '풍기역 ↔ 부석사', active: false },
  { id: 'north-3', group: '북부권 노선', name: '부석사 ↔ 소수서원', active: false },
  { id: 'downtown-1', group: '시내권 노선', name: '시내권 ↔ 영주역', active: true },
  { id: 'downtown-2', group: '시내권 노선', name: '시내권 ↔ 부석사', active: true },
  { id: 'downtown-3', group: '시내권 노선', name: '시내권 ↔ 무섬마을', active: false },
  { id: 'south-1', group: '남부권 노선', name: '영주역 ↔ 무섬마을', active: true },
  { id: 'south-2', group: '남부권 노선', name: '남부권 ↔ 부석사', active: false },
  { id: 'south-3', group: '남부권 노선', name: '남부권 ↔ 소수서원', active: false },
]

type RouteSetting = (typeof INITIAL_ROUTES)[number]

export default function Settings() {
  const [peakInterval, setPeakInterval] = useState(10)
  const [offPeakInterval, setOffPeakInterval] = useState(15)
  const [nightInterval, setNightInterval] = useState(20)
  const [routes, setRoutes] = useState<RouteSetting[]>(INITIAL_ROUTES)
  const [savedAt, setSavedAt] = useState('')

  const groupedRoutes = useMemo(() => {
    return routes.reduce<Record<string, RouteSetting[]>>((acc, route) => {
      acc[route.group] = [...(acc[route.group] ?? []), route]
      return acc
    }, {})
  }, [routes])

  const activeCount = routes.filter((route) => route.active).length

  const toggleRoute = (id: string) => {
    setRoutes((items) =>
      items.map((item) => (item.id === id ? { ...item, active: !item.active } : item)),
    )
  }

  const handleSave = () => {
    setSavedAt(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }))
  }

  return (
    <div className="p-6 space-y-5">
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-menthe/10 text-menthe flex items-center justify-center">
            <SettingsIcon size={20} />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">운영 설정</h2>
            <p className="text-xs text-gray-400 mt-0.5">배차 노선 및 운행 정책을 관리합니다.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">활성 노선 {activeCount}개</span>
          <button
            type="button"
            onClick={handleSave}
            className="h-9 px-4 rounded-lg bg-menthe text-white text-xs font-bold flex items-center gap-2 hover:bg-[#2ab5a2] transition"
          >
            <Save size={14} />
            저장
          </button>
        </div>
      </section>

      {savedAt && (
        <div className="rounded-xl bg-menthe/10 border border-menthe/20 px-4 py-3 text-xs font-semibold text-menthe">
          {savedAt} 기준 운영 설정을 임시 저장했습니다.
        </div>
      )}

      <div className="grid grid-cols-[1fr_1.08fr] gap-5">
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
          <div className="flex items-center gap-2 mb-5">
            <Clock3 size={18} className="text-menthe" />
            <h3 className="text-sm font-extrabold text-gray-800">배차 간격 관리</h3>
          </div>

          <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 mb-5">
            <p className="text-xs font-bold text-blue-700 mb-1">운영 기준 안내</p>
            <p className="text-xs text-blue-500 leading-5">
              관광 성수기와 주말 수요에 따라 시간대별 배차 간격을 조정합니다.
            </p>
          </div>

          <IntervalSelector label="성수기" value={peakInterval} onChange={setPeakInterval} />
          <IntervalSelector label="비성수기" value={offPeakInterval} onChange={setOffPeakInterval} />
          <IntervalSelector label="야간대" value={nightInterval} onChange={setNightInterval} />
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Route size={18} className="text-menthe" />
              <h3 className="text-sm font-extrabold text-gray-800">노선 관리</h3>
            </div>
            <button
              type="button"
              className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-semibold text-gray-500 flex items-center gap-1 hover:border-menthe hover:text-menthe"
            >
              <Plus size={13} />
              노선 추가
            </button>
          </div>

          <p className="text-xs text-gray-400 mb-4">
            운영하는 노선을 선택하고 비활성 노선을 대기 상태로 전환할 수 있습니다.
          </p>

          <div className="space-y-5">
            {Object.entries(groupedRoutes).map(([group, groupRoutes]) => (
              <div key={group}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-gray-600">{group}</h4>
                  <span className="text-[11px] text-gray-300">
                    {groupRoutes.filter((route) => route.active).length}/{groupRoutes.length}
                  </span>
                </div>
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  {groupRoutes.map((route) => (
                    <button
                      key={route.id}
                      type="button"
                      onClick={() => toggleRoute(route.id)}
                      className="w-full h-11 px-3 flex items-center justify-between border-b border-gray-100 last:border-b-0 hover:bg-gray-50 text-left"
                    >
                      <span className="text-xs font-medium text-gray-600">{route.name}</span>
                      <span className={`flex items-center gap-2 text-[11px] font-bold ${route.active ? 'text-menthe' : 'text-gray-300'}`}>
                        {route.active ? '활성' : '비활성'}
                        {route.active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

type IntervalSelectorProps = {
  label: string
  value: number
  onChange: (value: number) => void
}

function IntervalSelector({ label, value, onChange }: IntervalSelectorProps) {
  return (
    <div className="grid grid-cols-[72px_1fr_56px] items-center gap-3 py-3 border-b border-gray-50 last:border-b-0">
      <span className="text-xs font-bold text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        {INTERVALS.map((interval) => (
          <button
            key={interval}
            type="button"
            onClick={() => onChange(interval)}
            className={`h-8 px-3 rounded-lg border text-xs font-bold transition ${
              value === interval
                ? 'bg-menthe border-menthe text-white'
                : 'bg-white border-gray-200 text-gray-400 hover:border-menthe hover:text-menthe'
            }`}
          >
            {interval}분
          </button>
        ))}
      </div>
      <span className="text-right text-xs font-extrabold text-gray-700">{value}분</span>
    </div>
  )
}
