import { useMemo, useState } from 'react'
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
import './pages.css'
import './TablePages.css'

export function ReportsPage() {
  const { t } = useI18n()
  const [crop, setCrop] = useState('all')
  const [region, setRegion] = useState('all')
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return reportRows.filter((r) => {
      if (crop !== 'all' && r.crop !== crop) return false
      if (region !== 'all' && r.regionId !== region) return false
      if (!q) return true
      const regionName = t(`region.${r.regionId}`).toLowerCase()
      const cropName = t(`ai.crop.${r.crop}`).toLowerCase()
      return regionName.includes(q) || cropName.includes(q) || r.date.includes(q)
    })
  }, [crop, region, query, t])

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
          <button type="button" className="btn btn--primary" onClick={exportCsv}>
            <Download size={15} />
            {t('reports.export')}
          </button>
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

        <div className="table-panel__scroll">
          <table className="rich-table">
            <thead>
              <tr>
                <th>{t('reports.col.region')}</th>
                <th>{t('reports.col.crop')}</th>
                <th>{t('reports.col.yield')}</th>
                <th>{t('reports.col.confidence')}</th>
                <th>{t('reports.col.date')}</th>
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
                  </tr>
                )
              })}
              {!rows.length ? (
                <tr>
                  <td colSpan={5} className="rich-table__empty">
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
