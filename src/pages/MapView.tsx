import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { X } from 'lucide-react'

/* ─── 데이터 ───────────────────────────────────────────
 *
 * ⚠️ 좌표 정합성
 *   이 좌표는 모바일 앱(my-drt-app: src/data/yeongju.js)의 폴백 값과
 *   동일하게 유지해야 한다. 이전에는 두 리포의 값이 서로 달랐다.
 *
 *   관광지 3곳의 좌표는 2026-07-19 TourAPI(KorService2) 응답으로 검증 완료.
 *   영주역·풍기역은 TourAPI에 등록이 없어 미검증 상태다.
 */

type LocType = 'station' | 'tourist'

interface MapLoc {
  id: string
  name: string
  lat: number
  lng: number
  type: LocType
  color: string
  dailyDemand: number
  region?: string
  description: string
  weekendDelta?: number
}

interface MapRoute {
  from: string
  to: string
  demand: number
}

const LOCS: MapLoc[] = [
  {
    id: 'yeongju',
    name: '영주역',
    lat: 36.8003,
    lng: 128.6285,
    type: 'station',
    color: '#35C8B4',
    dailyDemand: 247,
    description: '영주시 주요 출발 거점',
    weekendDelta: 39,
  },
  {
    id: 'punggi',
    name: '풍기역',
    lat: 36.8171,
    lng: 128.4854,
    type: 'station',
    color: '#2aaa99',
    dailyDemand: 128,
    description: '풍기읍 보조 출발 거점',
    weekendDelta: 18,
  },
  {
    id: 'sosu',
    name: '소수서원',
    lat: 36.9252,
    lng: 128.5791,
    type: 'tourist',
    color: '#A4CF4A',
    dailyDemand: 147,
    region: '북부권',
    description: '조선 최초 사액서원 · 유네스코 세계유산',
  },
  {
    id: 'buseok',
    name: '부석사',
    lat: 36.9984,
    lng: 128.6871,
    type: 'tourist',
    color: '#A4CF4A',
    dailyDemand: 120,
    region: '북부권',
    description: '676년 창건 국보급 사찰 · 유네스코 세계유산',
  },
  {
    id: 'museom',
    name: '무섬마을',
    lat: 36.7319,
    lng: 128.6216,
    type: 'tourist',
    color: '#8ab83a',
    dailyDemand: 45,
    region: '남부권',
    description: '낙동강 물돌이 전통 한옥마을',
  },
]

const ROUTES: MapRoute[] = [
  { from: 'yeongju', to: 'sosu',   demand: 95 },
  { from: 'yeongju', to: 'buseok', demand: 85 },
  { from: 'yeongju', to: 'museom', demand: 45 },
  { from: 'punggi',  to: 'sosu',   demand: 52 },
  { from: 'punggi',  to: 'buseok', demand: 48 },
  { from: 'punggi',  to: 'museom', demand: 25 },
]

/* ─── 마커 아이콘 생성 ───────────────────────────────── */

function makeIcon(loc: MapLoc, selected: boolean) {
  const size = loc.type === 'station'
    ? 40
    : Math.min(56, 32 + Math.floor(loc.dailyDemand / 6))

  const emoji = loc.type === 'station' ? '🚉' : '🏛️'
  const ring = selected
    ? `0 0 0 4px white, 0 0 0 6px ${loc.color}`
    : '0 2px 10px rgba(0,0,0,0.22)'

  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${loc.color};
      border:3px solid white;
      border-radius:50%;
      box-shadow:${ring};
      display:flex;align-items:center;justify-content:center;
      font-size:${Math.floor(size * 0.42)}px;
      cursor:pointer;
      transition:box-shadow 0.2s;
    ">${emoji}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 6)],
  })
}

/* ─── 사이드 패널 ────────────────────────────────────── */

function BarRow({ label, demand, max, color }: {
  label: string; demand: number; max: number; color: string
}) {
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold" style={{ color }}>{demand}명/일</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full">
        <div
          className="h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${(demand / max) * 100}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function SidePanel({ selectedId, onClose }: {
  selectedId: string | null
  onClose: () => void
}) {
  const loc = selectedId ? LOCS.find((l) => l.id === selectedId) : null
  const relatedRoutes = selectedId
    ? ROUTES.filter((r) => r.from === selectedId || r.to === selectedId)
    : []

  if (!loc) {
    // 전체 요약
    const totalDemand = ROUTES.reduce((s, r) => s + r.demand, 0)
    return (
      <div className="flex flex-col h-full">
        <div className="px-5 py-5 border-b border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">노선 현황</p>
          <h2 className="text-base font-bold text-gray-800">영주 관광 DRT</h2>
        </div>
        <div className="flex-1 px-5 py-4 space-y-4 overflow-y-auto">
          {/* 통계 카드 */}
          {[
            { label: '총 운행 노선',   value: `${ROUTES.length}개` },
            { label: '출발 거점',      value: '2개역' },
            { label: '관광 목적지',    value: '3개소' },
            { label: '일 평균 총 수요', value: `${totalDemand}명` },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-400">{label}</span>
              <span className="text-sm font-bold text-gray-800">{value}</span>
            </div>
          ))}

          {/* 노선 목록 */}
          <div className="pt-2">
            <p className="text-xs font-semibold text-gray-500 mb-3">전체 노선 수요</p>
            {ROUTES.map((r) => {
              const from = LOCS.find((l) => l.id === r.from)!
              const to   = LOCS.find((l) => l.id === r.to)!
              return (
                <BarRow
                  key={`${r.from}-${r.to}`}
                  label={`${from.name} → ${to.name}`}
                  demand={r.demand}
                  max={95}
                  color={from.color}
                />
              )
            })}
          </div>

          <p className="text-xs text-gray-300 text-center pt-2">
            마커를 클릭하면 상세 정보를 확인할 수 있어요.
          </p>
        </div>
      </div>
    )
  }

  // 선택된 위치 상세
  const isStation = loc.type === 'station'
  const fromRoutes = relatedRoutes.filter((r) => r.from === selectedId)
  const toRoutes   = relatedRoutes.filter((r) => r.to   === selectedId)
  const maxDemand  = Math.max(...relatedRoutes.map((r) => r.demand))

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{isStation ? '🚉' : '🏛️'}</span>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: loc.color }}
            >
              {isStation ? (loc.region ?? '출발역') : loc.region}
            </span>
          </div>
          <h2 className="text-base font-bold text-gray-800">{loc.name}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{loc.description}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-300 hover:text-gray-500 mt-0.5"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 px-5 py-4 overflow-y-auto space-y-5">
        {/* 핵심 지표 */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400 mb-0.5">일 평균 {isStation ? '탑승' : '방문'}</p>
            <p className="text-lg font-bold" style={{ color: loc.color }}>{loc.dailyDemand}</p>
            <p className="text-xs text-gray-400">명</p>
          </div>
          {isStation && loc.weekendDelta !== undefined ? (
            <div className="bg-orange-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-0.5">주말 급증</p>
              <p className="text-lg font-bold text-orange-500">+{loc.weekendDelta}%</p>
              <p className="text-xs text-gray-400">vs 평일</p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-0.5">권역</p>
              <p className="text-base font-bold text-gray-700">{loc.region}</p>
              <p className="text-xs text-gray-400">수요 집중</p>
            </div>
          )}
        </div>

        {/* 출발 노선 (역 선택 시) */}
        {fromRoutes.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">
              출발 노선 ({fromRoutes.length}개)
            </p>
            {fromRoutes.map((r) => {
              const dest = LOCS.find((l) => l.id === r.to)!
              return (
                <BarRow
                  key={r.to}
                  label={`→ ${dest.name}`}
                  demand={r.demand}
                  max={maxDemand}
                  color={loc.color}
                />
              )
            })}
          </div>
        )}

        {/* 유입 노선 (관광지 선택 시) */}
        {toRoutes.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">
              유입 노선 ({toRoutes.length}개)
            </p>
            {toRoutes.map((r) => {
              const origin = LOCS.find((l) => l.id === r.from)!
              return (
                <BarRow
                  key={r.from}
                  label={`← ${origin.name}`}
                  demand={r.demand}
                  max={maxDemand}
                  color={origin.color}
                />
              )
            })}
          </div>
        )}

        {/* 인사이트 */}
        {isStation && (
          <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 leading-relaxed">
            {loc.id === 'yeongju'
              ? '영주역은 전체 DRT 수요의 약 66%를 차지하는 주요 출발 거점입니다. 오전 09~11시에 수요가 집중됩니다.'
              : '풍기역은 소수서원·부석사 인근에 위치해 북부권 접근성이 높습니다. 주말 탑승 집중도에 유의하세요.'}
          </div>
        )}
        {!isStation && (
          <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 leading-relaxed">
            {loc.id === 'sosu' && '소수서원은 풍기역과 가장 가까운 북부권 핵심 관광지입니다. 5·9~11월 성수기에 집중 배차가 필요합니다.'}
            {loc.id === 'buseok' && '부석사는 영주·풍기 양방향 수요가 고른 편입니다. 부석사 구간은 산악 도로 특성상 소형 DRT 차량이 적합합니다.'}
            {loc.id === 'museom' && '무섬마을은 남부권 보조 수요 거점으로, 영주역 출발 비중이 높습니다. 평일 수요가 상대적으로 안정적입니다.'}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── 메인 컴포넌트 ──────────────────────────────────── */

export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<L.Map | null>(null)
  const markersRef   = useRef<Record<string, L.Marker>>({})
  const layersRef    = useRef<L.Layer[]>([])

  const [selectedId,  setSelectedId]  = useState<string | null>(null)
  const [showRoutes,  setShowRoutes]  = useState(true)
  const [showDemand,  setShowDemand]  = useState(true)

  // 지도 초기화 (1회)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [36.885, 128.555],
      zoom: 11,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // 레이어 재렌더 (선택/토글 변경 시)
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // 기존 레이어 제거
    layersRef.current.forEach((l) => l.remove())
    layersRef.current = []
    Object.values(markersRef.current).forEach((m) => m.remove())
    markersRef.current = {}

    // 노선 폴리라인
    if (showRoutes) {
      ROUTES.forEach((route) => {
        const from = LOCS.find((l) => l.id === route.from)!
        const to   = LOCS.find((l) => l.id === route.to)!
        const highlighted = selectedId === route.from || selectedId === route.to
        const color = from.id === 'yeongju' ? '#35C8B4' : '#A4CF4A'
        const weight = Math.max(2, route.demand / 18)

        const line = L.polyline(
          [[from.lat, from.lng], [to.lat, to.lng]],
          {
            color: highlighted ? '#f97316' : color,
            weight: highlighted ? weight + 3 : weight,
            opacity: highlighted ? 0.95 : 0.45,
            dashArray: highlighted ? undefined : '7 5',
          },
        ).bindTooltip(
          `<b>${from.name} → ${to.name}</b><br/>${route.demand}명/일`,
          { sticky: true },
        ).addTo(map)

        layersRef.current.push(line)
      })
    }

    // 수요 반경 원
    if (showDemand) {
      LOCS.filter((l) => l.type === 'tourist').forEach((loc) => {
        const circle = L.circle([loc.lat, loc.lng], {
          radius: Math.max(500, loc.dailyDemand * 4.5),
          color: loc.color,
          fillColor: loc.color,
          fillOpacity: selectedId === loc.id ? 0.18 : 0.07,
          weight: selectedId === loc.id ? 1.5 : 0,
        }).addTo(map)
        layersRef.current.push(circle)
      })
    }

    // 마커
    LOCS.forEach((loc) => {
      const marker = L.marker([loc.lat, loc.lng], {
        icon: makeIcon(loc, selectedId === loc.id),
      })
        .bindTooltip(`<b>${loc.name}</b><br/><span style="color:#6b7280">${loc.description}</span>`, {
          direction: 'top',
          offset: L.point(0, -4),
        })
        .on('click', () => setSelectedId((prev) => (prev === loc.id ? null : loc.id)))
        .addTo(map)

      markersRef.current[loc.id] = marker
    })
  }, [selectedId, showRoutes, showDemand])

  // 선택 시 지도 이동
  useEffect(() => {
    if (!mapRef.current || !selectedId) return
    const loc = LOCS.find((l) => l.id === selectedId)
    if (loc) mapRef.current.panTo([loc.lat, loc.lng], { animate: true, duration: 0.4 })
  }, [selectedId])

  return (
    <div className="flex" style={{ height: 'calc(100vh - 64px)' }}>
      {/* 지도 영역 */}
      <div className="flex-1 relative">
        <div ref={containerRef} className="w-full h-full" />

        {/* 레이어 토글 */}
        <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
          <button
            onClick={() => setShowRoutes((v) => !v)}
            className={`text-xs px-3 py-2 rounded-xl shadow-md font-semibold transition-all ${
              showRoutes ? 'bg-menthe text-white' : 'bg-white text-gray-400'
            }`}
          >
            노선 표시
          </button>
          <button
            onClick={() => setShowDemand((v) => !v)}
            className={`text-xs px-3 py-2 rounded-xl shadow-md font-semibold transition-all ${
              showDemand ? 'text-white' : 'bg-white text-gray-400'
            }`}
            style={showDemand ? { backgroundColor: '#A4CF4A' } : {}}
          >
            수요 반경
          </button>
        </div>

        {/* 범례 */}
        <div className="absolute bottom-6 left-4 z-[1000] bg-white rounded-xl shadow-md px-4 py-3 text-xs">
          <p className="font-bold text-gray-700 mb-2">범례</p>
          {[
            { color: '#35C8B4', label: '영주역 출발 노선' },
            { color: '#A4CF4A', label: '풍기역 출발 노선' },
            { color: '#f97316', label: '선택된 노선' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2 mb-1">
              <div className="w-5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-gray-500">{label}</span>
            </div>
          ))}
          <div className="border-t border-gray-100 mt-2 pt-2 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-base leading-none">🚉</span>
              <span className="text-gray-500">출발역</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base leading-none">🏛️</span>
              <span className="text-gray-500">관광지 (원 크기 = 수요량)</span>
            </div>
          </div>
        </div>

        {/* Kakao 전환 안내 배너 */}
        <div className="absolute bottom-6 right-6 z-[1000] bg-white/90 backdrop-blur-sm rounded-xl shadow-md px-4 py-2.5 text-xs text-gray-400 max-w-52">
          현재 OpenStreetMap 사용 중<br />
          <span className="text-menthe font-medium">Kakao Maps API 키 발급 후 교체 예정</span>
        </div>
      </div>

      {/* 정보 패널 */}
      <div className="w-72 bg-white border-l border-gray-100 flex-shrink-0 overflow-hidden">
        <SidePanel
          selectedId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      </div>
    </div>
  )
}
