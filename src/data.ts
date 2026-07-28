export const navItems = [
  { id: 'home', labelKey: 'nav.home', icon: 'home' },
  { id: 'map', labelKey: 'nav.map', icon: 'map' },
  { id: 'analytics', labelKey: 'nav.analytics', icon: 'analytics' },
  { id: 'input', labelKey: 'nav.input', icon: 'input' },
  { id: 'drone', labelKey: 'nav.drone', icon: 'drone' },
  { id: 'reports', labelKey: 'nav.reports', icon: 'reports' },
  { id: 'users', labelKey: 'nav.users', icon: 'users' },
  { id: 'settings', labelKey: 'nav.settings', icon: 'settings' },
] as const

export type NavId = (typeof navItems)[number]['id']

export const reportRows = [
  {
    id: 'r1',
    regionId: 'kashkadarya',
    crop: 'wheat' as const,
    yield: 4.8,
    confidence: 0.82,
    date: '2025-06-09',
  },
  {
    id: 'r2',
    regionId: 'kashkadarya',
    crop: 'cotton' as const,
    yield: 3.1,
    confidence: 0.76,
    date: '2025-06-09',
  },
  {
    id: 'r3',
    regionId: 'jizzakh',
    crop: 'wheat' as const,
    yield: 4.2,
    confidence: 0.79,
    date: '2025-06-08',
  },
  {
    id: 'r4',
    regionId: 'jizzakh',
    crop: 'cotton' as const,
    yield: 2.9,
    confidence: 0.71,
    date: '2025-06-08',
  },
  {
    id: 'r5',
    regionId: 'samarkand',
    crop: 'wheat' as const,
    yield: 5.1,
    confidence: 0.85,
    date: '2025-06-07',
  },
  {
    id: 'r6',
    regionId: 'fergana',
    crop: 'cotton' as const,
    yield: 3.4,
    confidence: 0.74,
    date: '2025-06-07',
  },
]

export const featureImportance = [
  { key: 'ndvi', weight: 0.32 },
  { key: 'rainfall', weight: 0.24 },
  { key: 'temp', weight: 0.18 },
  { key: 'soil', weight: 0.14 },
  { key: 'history', weight: 0.12 },
]

export const droneShots = [
  { id: 'd1', regionId: 'kashkadarya', date: '2025-06-05', label: 'Qarshi tumani — A12' },
  { id: 'd2', regionId: 'jizzakh', date: '2025-06-04', label: 'Zomin tumani — B04' },
  { id: 'd3', regionId: 'samarkand', date: '2025-06-03', label: 'Pastdarg‘om — C07' },
  { id: 'd4', regionId: 'kashkadarya', date: '2025-06-02', label: 'Kitob tumani — D01' },
  { id: 'd5', regionId: 'jizzakh', date: '2025-06-01', label: 'G‘allaorol — E09' },
  { id: 'd6', regionId: 'andijan', date: '2025-05-28', label: 'Asaka tumani — F03' },
]

export const usersMock = [
  { id: 'u1', name: 'Admin Pilot', login: 'admin', role: 'admin' as const, active: true },
  { id: 'u2', name: 'Dilshod Karimov', login: 'd.karimov', role: 'editor' as const, active: true },
  { id: 'u3', name: 'Nilufar Yusupova', login: 'n.yusupova', role: 'user' as const, active: true },
  { id: 'u4', name: 'Jasur Aliyev', login: 'j.aliyev', role: 'user' as const, active: false },
]

export const analyticsYieldSeries = [
  { label: 'Mar', wheat: 3.2, cotton: 2.1 },
  { label: 'Apr', wheat: 3.8, cotton: 2.4 },
  { label: 'May', wheat: 4.4, cotton: 2.8 },
  { label: 'Jun', wheat: 4.9, cotton: 3.1 },
]

export const kpiCards = [
  {
    id: 'area',
    labelKey: 'kpi.area',
    value: '4 892 142 га',
    trendValue: '↑ 8.6%',
    trendKey: 'kpi.trend.season',
    trendType: 'up' as const,
    icon: 'sprout',
  },
  {
    id: 'fields',
    labelKey: 'kpi.fields',
    value: '132 456',
    trendValue: '↑ 6.3%',
    trendKey: 'kpi.trend.season',
    trendType: 'up' as const,
    icon: 'grid',
  },
  {
    id: 'ndvi',
    labelKey: 'kpi.ndvi',
    value: '0.68',
    trendValue: '↑ 0.07',
    trendKey: 'kpi.trend.period',
    trendType: 'up' as const,
    icon: 'chart',
  },
  {
    id: 'yield',
    labelKey: 'kpi.yield',
    value: '5.6 т/га',
    trendValue: '↑ 12.4%',
    trendKey: 'kpi.trend.season',
    trendType: 'up' as const,
    icon: 'wheat',
  },
  {
    id: 'risk',
    labelKey: 'kpi.risk',
    value: '8.7%',
    trendValue: '↓ 1.3%',
    trendKey: 'kpi.trend.period',
    trendType: 'down' as const,
    icon: 'shield',
  },
  {
    id: 'alerts',
    labelKey: 'kpi.alerts',
    value: '24',
    trendValue: '',
    trendKey: 'kpi.viewAll',
    trendType: 'link' as const,
    icon: 'bell',
  },
]

export const regionStats = [
  { id: 'samarkand', value: 13890, ndvi: 0.76 },
  { id: 'kashkadarya', value: 12450, ndvi: 0.58 },
  { id: 'fergana', value: 11280, ndvi: 0.88 },
  { id: 'andijan', value: 10640, ndvi: 0.82 },
  { id: 'bukhara', value: 9870, ndvi: 0.41 },
  { id: 'namangan', value: 9210, ndvi: 0.79 },
  { id: 'surkhandarya', value: 8450, ndvi: 0.64 },
  { id: 'khorezm', value: 7680, ndvi: 0.52 },
  { id: 'jizzakh', value: 6920, ndvi: 0.48 },
  { id: 'sirdarya', value: 5840, ndvi: 0.71 },
  { id: 'navoi', value: 4560, ndvi: 0.28 },
  { id: 'tashkent', value: 4120, ndvi: 0.69 },
  { id: 'karakalpakstan', value: 3890, ndvi: 0.22 },
  { id: 'tashkent_city', value: 2100, ndvi: 0.55 },
]

export const ndviByRegionId = Object.fromEntries(
  regionStats.map((r) => [r.id, r.ndvi]),
) as Record<string, number>

export const ndviSeries = [
  { date: '10 Mar', value: 0.32 },
  { date: '24 Mar', value: 0.38 },
  { date: '07 Apr', value: 0.45 },
  { date: '21 Apr', value: 0.52 },
  { date: '05 May', value: 0.58 },
  { date: '19 May', value: 0.62 },
  { date: '02 Jun', value: 0.65 },
  { date: '09 Jun', value: 0.68 },
]

export const crops = [
  { key: 'wheat', area: '304 860 га', percent: 39.5, color: '#2fbf5b', icon: 'wheat' },
  { key: 'cotton', area: '196 808 га', percent: 25.5, color: '#7dd87f', icon: 'cotton' },
  { key: 'corn', area: '117 313 га', percent: 15.2, color: '#f0c14a', icon: 'corn' },
  { key: 'rice', area: '71 777 га', percent: 9.3, color: '#f08a4b', icon: 'rice' },
  { key: 'other', area: '81 038 га', percent: 10.5, color: '#b8c4bc', icon: 'other' },
]

export function ndviColor(ndvi: number): string {
  const t = Math.min(1, Math.max(0, ndvi))
  // Continuous NDVI palette (brown → yellow → lime → deep green)
  const stops: Array<[number, [number, number, number]]> = [
    [0, [120, 40, 20]],
    [0.15, [180, 70, 30]],
    [0.3, [210, 140, 40]],
    [0.45, [200, 190, 50]],
    [0.55, [140, 190, 55]],
    [0.7, [60, 170, 70]],
    [0.85, [30, 140, 55]],
    [1, [15, 95, 40]],
  ]
  let i = 0
  while (i < stops.length - 1 && t > stops[i + 1][0]) i++
  const [t0, c0] = stops[i]
  const [t1, c1] = stops[Math.min(i + 1, stops.length - 1)]
  const p = t1 === t0 ? 0 : (t - t0) / (t1 - t0)
  const r = Math.round(c0[0] + (c1[0] - c0[0]) * p)
  const g = Math.round(c0[1] + (c1[1] - c0[1]) * p)
  const b = Math.round(c0[2] + (c1[2] - c0[2]) * p)
  return `rgb(${r},${g},${b})`
}

/** Wider per-feature variation so NDVI colors look realistic */
export function featureIndexValue(base: number, seed: string, index: string): number {
  let h = 0
  const key = `${seed}:${index}`
  for (let i = 0; i < key.length; i++) h = (h * 33 + key.charCodeAt(i)) >>> 0
  // Strong variation: roughly ±0.28 around base
  const delta = ((h % 57) - 28) / 100
  const wave = ((h >> 3) % 23) / 100 - 0.11
  const bias =
    index === 'EVI' ? 0.05 : index === 'SAVI' ? -0.04 : index === 'NDWI' ? -0.1 : 0
  return Math.min(0.96, Math.max(0.06, base + delta + wave + bias))
}
