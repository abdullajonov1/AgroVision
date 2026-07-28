import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ArrowRight, ArrowLeft } from 'lucide-react'
import { useI18n } from '../i18n/I18nContext'
import { useGeo } from '../context/GeoContext'
import { regionStats } from '../data'
import './RegionStats.css'

const metrics = [
  { id: 'fields', key: 'regions.metric.fields' },
  { id: 'area', key: 'regions.metric.area' },
  { id: 'yield', key: 'regions.metric.yield' },
] as const

export function RegionStats() {
  const { t } = useI18n()
  const {
    districts,
    selectedRegionId,
    selectedDistrictId,
    setSelectedRegionId,
    setSelectedDistrictId,
    clearSelection,
  } = useGeo()
  const [metric, setMetric] = useState<(typeof metrics)[number]['id']>('fields')
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const rows = useMemo(() => {
    if (selectedRegionId && districts) {
      return districts.features
        .filter((f) => f.properties.regionId === selectedRegionId)
        .map((f) => ({
          id: String(f.properties.id),
          name: f.properties.name_en,
          value: f.properties.fields,
        }))
        .sort((a, b) => b.value - a.value)
    }

    return regionStats
      .filter((r) => r.id !== 'tashkent_city')
      .map((r) => ({
        id: r.id,
        name: t(`region.${r.id}`),
        value: r.value,
      }))
  }, [selectedRegionId, districts, t])

  const max = Math.max(...rows.map((r) => r.value), 1)
  const metricLabel = t(metrics.find((m) => m.id === metric)?.key ?? metrics[0].key)
  const title = selectedRegionId
    ? `${t(`region.${selectedRegionId}`)} — ${t('regions.districtsTitle')}`
    : t('regions.title')

  return (
    <section className="region-stats">
      <div className="region-stats__header">
        <div>
          {selectedRegionId && (
            <button
              type="button"
              className="region-stats__back"
              onClick={() => {
                if (selectedDistrictId) setSelectedDistrictId(null)
                else clearSelection()
              }}
            >
              <ArrowLeft size={14} />
              {selectedDistrictId ? t('regions.districtsTitle') : t('regions.back')}
            </button>
          )}
          <h2>{title}</h2>
        </div>
        <div className="region-stats__dropdown" ref={dropdownRef}>
          <button
            type="button"
            className="region-stats__select"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            {metricLabel}
            <ChevronDown size={14} />
          </button>
          {open && (
            <ul className="region-stats__menu">
              {metrics.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={item.id === metric ? 'is-active' : ''}
                    onClick={() => {
                      setMetric(item.id)
                      setOpen(false)
                    }}
                  >
                    {t(item.key)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="region-stats__list">
        {rows.map((row) => {
          const active = selectedDistrictId === row.id
          return (
            <button
              key={row.id}
              type="button"
              className={`region-stats__row${active ? ' is-active' : ''}`}
              onClick={() => {
                if (!selectedRegionId) {
                  setSelectedRegionId(row.id)
                  return
                }
                setSelectedDistrictId(row.id)
              }}
            >
              <div className="region-stats__name">{row.name}</div>
              <div className="region-stats__bar-wrap">
                <div
                  className="region-stats__bar"
                  style={{ width: `${(row.value / max) * 100}%` }}
                />
              </div>
              <div className="region-stats__value">
                {row.value.toLocaleString('ru-RU')}
              </div>
            </button>
          )
        })}
      </div>

      {!selectedRegionId && (
        <div className="region-stats__footer">
          <span>{t('regions.hint')}</span>
          <ArrowRight size={16} />
        </div>
      )}
    </section>
  )
}
