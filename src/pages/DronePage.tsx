import { useMemo, useState } from 'react'
import { Plane } from 'lucide-react'
import { useI18n } from '../i18n/I18nContext'
import { droneShots, regionStats } from '../data'
import './pages.css'
import './DronePage.css'

export function DronePage() {
  const { t } = useI18n()
  const [region, setRegion] = useState('all')

  const items = useMemo(
    () =>
      droneShots.filter((d) => (region === 'all' ? true : d.regionId === region)),
    [region],
  )

  return (
    <div className="page">
      <div className="page-card">
        <h2>{t('drone.title')}</h2>
        <div className="toolbar">
          <div className="field">
            <label>{t('drone.filter.region')}</label>
            <select value={region} onChange={(e) => setRegion(e.target.value)}>
              <option value="all">{t('reports.filter.all')}</option>
              {regionStats.map((r) => (
                <option key={r.id} value={r.id}>
                  {t(`region.${r.id}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="banner banner--warn">{t('drone.empty')}</div>
        ) : (
          <div className="drone-grid">
            {items.map((d, i) => (
              <article key={d.id} className="drone-card">
                <div
                  className="drone-card__thumb"
                  style={{
                    background: `linear-gradient(145deg, hsl(${120 + i * 18} 35% 28%), hsl(${90 + i * 12} 40% 18%))`,
                  }}
                >
                  <Plane size={28} />
                </div>
                <div className="drone-card__body">
                  <strong>{d.label}</strong>
                  <span>
                    {t(`region.${d.regionId}`)} · {d.date}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
