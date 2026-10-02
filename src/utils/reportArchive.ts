export type ReportReview = 'confirmed' | 'escalated'

export type SavedReport = {
  id: string
  regionId: string
  crop: 'wheat' | 'cotton'
  yield: number
  confidence: number
  r2: number
  mae: number
  rmse: number
  date: string
  fieldId: string | null
}

const REPORTS_KEY = 'agrovision-saved-reports'
const REVIEWS_KEY = 'agrovision-report-reviews'

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function readSavedReports(): SavedReport[] {
  const list = readJson<SavedReport[]>(REPORTS_KEY, [])
  return Array.isArray(list) ? list : []
}

export function saveForecastReport(report: Omit<SavedReport, 'id' | 'date'>): string {
  const id = `s-${Date.now()}`
  const next: SavedReport = {
    ...report,
    id,
    date: new Date().toISOString().slice(0, 10),
  }
  const list = [next, ...readSavedReports()].slice(0, 40)
  localStorage.setItem(REPORTS_KEY, JSON.stringify(list))
  window.dispatchEvent(new Event('agrovision-reports'))
  return id
}

export function readReportReviews(): Record<string, ReportReview> {
  const map = readJson<Record<string, ReportReview>>(REVIEWS_KEY, {})
  return map && typeof map === 'object' ? map : {}
}

export function setReportReview(id: string, review: ReportReview) {
  const map = readReportReviews()
  map[id] = review
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(map))
  window.dispatchEvent(new Event('agrovision-reports'))
}
