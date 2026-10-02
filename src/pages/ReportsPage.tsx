import { useEffect, useMemo, useState } from 'react'
import {
  Download,
  FileBarChart2,
  TrendingUp,
  Percent,
  MapPinned,
  Search,
} from 'lucide-react'
import { useI18n } from '../i18n/I18nContext'
import { reportRows, regionStats } from '../data'
import {
  readReportReviews,
  readSavedReports,
  setReportReview,
  type ReportReview,
} from '../utils/reportArchive'
import './pages.css'
import './TablePages.css'

type ReportView = {
  id: string
  regionId: string
  crop: 'wheat' | 'cotton'
  yield: number
  confidence: number
  date: string
  r2: number | null
  mae: number | null
  rmse: number | null
  saved: boolean
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

export function ReportsPage() {
  const { t } = useI18n()
  const [crop, setCrop] = useState('all')
  const [region, setRegion] = useState('all')
  const [query, setQuery] = useState('')
  const [savedTick, setSavedTick] = useState(0)
  const [openId, setOpenId] = useState<string | null>(null)
  const [reviews, setReviews] = useState<Record<string, ReportReview>>({})

  useEffect(() => {
    const sync = () => {
      setSavedTick((v) => v + 1)
      setReviews(readReportReviews())
    }
    sync()
    window.addEventListener('agrovision-reports', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('agrovision-reports', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const allRows = useMemo(() => {
    const saved: ReportView[] = readSavedReports().map((r) => ({
      id: r.id,
      regionId: r.regionId,
      crop: r.crop,
      yield: r.yield,
      confidence: r.confidence,
      date: r.date,
      r2: r.r2,
      mae: r.mae,
      rmse: r.rmse,
      saved: true,
    }))
    const seed: ReportView[] = reportRows.map((r) => ({
      ...r,
      r2: null,
      mae: null,
      rmse: null,
      saved: false,
    }))
    return [...saved, ...seed]
  }, [savedTick])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allRows.filter((r) => {
      if (crop !== 'all' && r.crop !== crop) return false
      if (region !== 'all' && r.regionId !== region) return false
      if (!q) return true
      const regionName = t(`region.${r.regionId}`).toLowerCase()
      const cropName = t(`ai.crop.${r.crop}`).toLowerCase()
      return regionName.includes(q) || cropName.includes(q) || r.date.includes(q)
    })
  }, [allRows, crop, region, query, t])

  const open = rows.find((r) => r.id === openId) ?? null

  const downloadHtml = (list: ReportView[]) => {
    const body = list
      .map((r) => {
        const conf = Math.round(r.confidence * 100)
        return `<tr><td>${escapeHtml(t(`region.${r.regionId}`))}</td><td>${escapeHtml(t(`ai.crop.${r.crop}`))}</td><td>${r.yield.toFixed(1)}</td><td>${conf}%</td><td>${escapeHtml(r.date)}</td><td>${r.r2?.toFixed(2) ?? '—'}</td><td>${r.mae?.toFixed(2) ?? '—'}</td><td>${r.rmse?.toFixed(2) ?? '—'}</td></tr>`
      })
      .join('')
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(t('reports.detail'))}</title></head><body><h1>${escapeHtml(t('reports.detail'))}</h1><table border="1" cellpadding="6"><thead><tr><th>${escapeHtml(t('reports.col.region'))}</th><th>${escapeHtml(t('reports.col.crop'))}</th><th>${escapeHtml(t('reports.col.yield'))}</th><th>${escapeHtml(t('reports.col.confidence'))}</th><th>${escapeHtml(t('reports.col.date'))}</th><th>R2</th><th>MAE</th><th>RMSE</th></tr></thead><tbody>${body}</tbody></table></body></html>`
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'agrovision-report.html'
    a.click()
    URL.revokeObjectURL(url)
  }

  const stats = useMemo(() => {
    if (!rows.length) {
      return { avgYield: 0, avgConf: 0, regions: 0 }
    }
    const avgYield = rows.reduce((s, r) => s + r.yield, 0) / rows.length
    const avgConf = rows.reduce((s, r) => s + r.confidence, 0) / rows.length
    const regions = new Set(rows.map((r) => r.regionId)).size
    return { avgYield, avgConf, regions }
  }, [rows])

  const exportCsv = () => {
    const header = [
      t('reports.col.region'),
      t('reports.col.crop'),
      t('reports.col.yield'),
      t('reports.col.confidence'),
      t('reports.col.date'),
    ]
    const body = rows.map((r) =>
      [
        t(`region.${r.regionId}`),
        t(`ai.crop.${r.crop}`),
        r.yield,
        `${Math.round(r.confidence * 100)}%`,
        r.date,
      ].join(','),
    )
    const blob = new Blob([[header.join(','), ...body].join('\n')], {
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'agrovision-reports.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="table-page page">
      <div className="table-page__stats">
        <article className="table-stat">
          <div className="table-stat__icon">
            <FileBarChart2 size={18} />
          </div>
          <div>
            <span>{t('reports.stat.rows')}</span>
            <strong>{rows.length}</strong>
          </div>
        </article>
        <article className="table-stat">
          <div className="table-stat__icon is-ok">
            <TrendingUp size={18} />
          </div>
          <div>
            <span>{t('reports.stat.avgYield')}</span>
            <strong>{stats.avgYield.toFixed(1)}</strong>
          </div>
        </article>
        <article className="table-stat">
          <div className="table-stat__icon is-admin">
            <Percent size={18} />
          </div>
          <div>
            <span>{t('reports.stat.avgConf')}</span>
            <strong>{Math.round(stats.avgConf * 100)}%</strong>
          </div>
        </article>
        <article className="table-stat">
          <div className="table-stat__icon is-warn">
            <MapPinned size={18} />
          </div>
          <div>
            <span>{t('reports.stat.regions')}</span>
            <strong>{stats.regions}</strong>
          </div>
        </article>
      </div>

      <section className="table-panel">
        <header className="table-panel__head">
          <div>
            <h2>{t('reports.title')}</h2>
            <p>{t('reports.hint')}</p>
          </div>
          <div className="table-panel__actions">
            <button type="button" className="btn btn--ghost" onClick={() => downloadHtml(open ? [open] : rows)}>
              <Download size={15} />
              {t('reports.downloadHtml')}
            </button>
            <button type="button" className="btn btn--primary" onClick={exportCsv}>
              <Download size={15} />
              {t('reports.export')}
            </button>
          </div>
        </header>

        <div className="table-panel__toolbar">
          <div className="table-search">
            <Search size={15} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('reports.search')}
            />
          </div>
          <label className="table-filter">
            <span>{t('reports.filter.crop')}</span>
            <select value={crop} onChange={(e) => setCrop(e.target.value)}>
              <option value="all">{t('reports.filter.all')}</option>
              <option value="wheat">{t('ai.crop.wheat')}</option>
              <option value="cotton">{t('ai.crop.cotton')}</option>
            </select>
          </label>
          <label className="table-filter">
            <span>{t('reports.filter.region')}</span>
            <select value={region} onChange={(e) => setRegion(e.target.value)}>
              <option value="all">{t('reports.filter.all')}</option>
              {regionStats.map((r) => (
                <option key={r.id} value={r.id}>
                  {t(`region.${r.id}`)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {open ? (
          <article className="report-detail">
            <header>
              <div>
                <h3>{t('reports.detail')}</h3>
                <p>
                  {t(`region.${open.regionId}`)} · {t(`ai.crop.${open.crop}`)} · {open.date}
                  {open.saved ? ` · ${t('reports.saved')}` : ''}
                </p>
              </div>
              <button type="button" onClick={() => setOpenId(null)}>
                {t('reports.close')}
              </button>
            </header>
            <ul>
              <li>
                <span>{t('reports.col.yield')}</span>
                <b>
                  {open.yield.toFixed(1)} {t('ai.unit')}
                </b>
              </li>
              <li>
                <span>{t('reports.col.confidence')}</span>
                <b>{Math.round(open.confidence * 100)}%</b>
              </li>
              <li>
                <span>R²</span>
                <b>{open.r2?.toFixed(2) ?? '—'}</b>
              </li>
              <li>
                <span>MAE</span>
                <b>{open.mae?.toFixed(2) ?? '—'}</b>
              </li>
              <li>
                <span>RMSE</span>
                <b>{open.rmse?.toFixed(2) ?? '—'}</b>
              </li>
            </ul>
            {open.r2 == null ? <p className="report-detail__note">{t('reports.metricsMissing')}</p> : null}
            {open.confidence < 0.75 ? (
              <div className="report-detail__review">
                <p>
                  {reviews[open.id] === 'confirmed'
                    ? t('ai.review.confirmed')
                    : reviews[open.id] === 'escalated'
                      ? t('ai.review.escalated')
                      : t('ai.review.text')}
                </p>
                {reviews[open.id] ? null : (
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setReportReview(open.id, 'confirmed')
                        setReviews(readReportReviews())
                      }}
                    >
                      {t('ai.review.confirm')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReportReview(open.id, 'escalated')
                        setReviews(readReportReviews())
                      }}
                    >
                      {t('ai.review.escalate')}
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </article>
        ) : null}

        <div className="table-panel__scroll">
          <table className="rich-table">
            <thead>
              <tr>
                <th>{t('reports.col.region')}</th>
                <th>{t('reports.col.crop')}</th>
                <th>{t('reports.col.yield')}</th>
                <th>{t('reports.col.confidence')}</th>
                <th>{t('reports.col.date')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const conf = Math.round(r.confidence * 100)
                const confTone = conf >= 80 ? 'is-high' : conf >= 70 ? 'is-mid' : 'is-low'
                return (
                  <tr key={r.id}>
                    <td>
                      <strong>{t(`region.${r.regionId}`)}</strong>
                    </td>
                    <td>
                      <span className={`crop-pill crop-pill--${r.crop}`}>
                        {t(`ai.crop.${r.crop}`)}
                      </span>
                    </td>
                    <td className="mono">{r.yield.toFixed(1)}</td>
                    <td>
                      <div className={`conf-cell ${confTone}`}>
                        <div className="conf-cell__bar">
                          <span style={{ width: `${conf}%` }} />
                        </div>
                        <b>{conf}%</b>
                      </div>
                    </td>
                    <td className="muted">{r.date}</td>
                    <td>
                      <button type="button" className="report-open" onClick={() => setOpenId(r.id)}>
                        {t('reports.detail')}
                      </button>
                    </td>
                  </tr>
                )
              })}
              {!rows.length ? (
                <tr>
                  <td colSpan={6} className="rich-table__empty">
                    {t('reports.empty')}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
