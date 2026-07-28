import { useEffect, useMemo, useState } from 'react'
import {
  Sparkles,
  Wheat,
  Flower2,
  Play,
  Loader2,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react'
import { useI18n } from '../i18n/I18nContext'
import { useGeo } from '../context/GeoContext'
import { featureImportance, ndviByRegionId, regionStats } from '../data'
import './AiForecastPanel.css'

type Crop = 'wheat' | 'cotton'

type Result = {
  yield: number
  confidence: number
  r2: number
  mae: number
  rmse: number
  fallback?: boolean
}

const PILOT_REGIONS = new Set(['kashkadarya', 'jizzakh'])

function mockResult(crop: Crop, regionId: string, fallback: boolean): Result {
  if (fallback) {
    const ndvi = ndviByRegionId[regionId] ?? 0.55
    const base = crop === 'wheat' ? 3.2 : 2.1
    return {
      yield: Math.round((base + ndvi * 2.4) * 10) / 10,
      confidence: Math.round((0.55 + ndvi * 0.2) * 100) / 100,
      r2: 0.41,
      mae: 0.62,
      rmse: 0.78,
      fallback: true,
    }
  }
  const base = crop === 'wheat' ? 4.6 : 3.0
  const regionBoost = regionId === 'kashkadarya' ? 0.25 : regionId === 'jizzakh' ? -0.1 : 0
  const seed = regionId.length + crop.length
  return {
    yield: Math.round((base + regionBoost + (seed % 5) * 0.08) * 10) / 10,
    confidence: Math.round((0.72 + (seed % 7) * 0.02) * 100) / 100,
    r2: 0.58 + (seed % 4) * 0.01,
    mae: 0.42 + (seed % 3) * 0.03,
    rmse: 0.55 + (seed % 3) * 0.04,
  }
}

export function AiForecastPanel() {
  const { t } = useI18n()
  const { selectedRegionId, setSelectedRegionId } = useGeo()
  const [crop, setCrop] = useState<Crop>('wheat')
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [ndviFallback, setNdviFallback] = useState(false)
  const [result, setResult] = useState<Result | null>(null)

  const regionId = selectedRegionId ?? ''

  const regions = useMemo(
    () =>
      regionStats.map((r) => ({
        id: r.id,
        label: t(`region.${r.id}`),
        pilot: PILOT_REGIONS.has(r.id),
      })),
    [t],
  )

  useEffect(() => {
    setResult(null)
    setError('')
  }, [crop, regionId, ndviFallback])

  const run = () => {
    if (!regionId) {
      setError(t('ai.err.region'))
      return
    }
    setError('')
    setRunning(true)
    window.setTimeout(() => {
      setResult(mockResult(crop, regionId, ndviFallback))
      setRunning(false)
    }, ndviFallback ? 600 : 1400)
  }

  return (
    <aside className="ai-panel">
      <header className="ai-panel__head">
        <div className="ai-panel__title">
          <Sparkles size={16} />
          <div>
            <h2>{t('ai.title')}</h2>
            <p>{t('ai.hint')}</p>
          </div>
        </div>
      </header>

      <div className="ai-panel__body">
        <section className="ai-panel__section">
          <label>{t('ai.crop')}</label>
          <div className="ai-panel__crops" role="group" aria-label={t('ai.crop')}>
            <button
              type="button"
              className={`ai-panel__crop${crop === 'wheat' ? ' is-active' : ''}`}
              onClick={() => setCrop('wheat')}
            >
              <Wheat size={15} />
              {t('ai.crop.wheat')}
            </button>
            <button
              type="button"
              className={`ai-panel__crop${crop === 'cotton' ? ' is-active' : ''}`}
              onClick={() => setCrop('cotton')}
            >
              <Flower2 size={15} />
              {t('ai.crop.cotton')}
            </button>
          </div>
        </section>

        <section className="ai-panel__section">
          <label htmlFor="ai-region">{t('ai.region')}</label>
          <select
            id="ai-region"
            value={regionId}
            onChange={(e) => setSelectedRegionId(e.target.value || null)}
            className={!regionId ? 'is-empty' : undefined}
          >
            <option value="">{t('ai.regionPh')}</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
                {r.pilot ? ` · ${t('ai.pilot')}` : ''}
              </option>
            ))}
          </select>
          <small className="ai-panel__hint">{t('ai.regionHint')}</small>
          {error ? <em className="field-error">{error}</em> : null}
        </section>

        <label className="ai-panel__fallback">
          <input
            type="checkbox"
            checked={ndviFallback}
            onChange={(e) => setNdviFallback(e.target.checked)}
          />
          <span>{t('ai.fallbackToggle')}</span>
        </label>

        <button
          type="button"
          className="ai-panel__run"
          onClick={run}
          disabled={running}
        >
          {running ? <Loader2 size={16} className="ai-panel__spin" /> : <Play size={16} />}
          {running ? t('ai.running') : t('ai.run')}
        </button>

        {result ? (
          <>
            {result.fallback ? (
              <div className="ai-panel__banner" role="status">
                {t('ai.fallback')}
              </div>
            ) : null}
            <div className="ai-panel__kpis">
              <article className="ai-panel__kpi">
                <div className="ai-panel__kpi-icon">
                  <TrendingUp size={16} />
                </div>
                <div>
                  <span>{t('ai.yield')}</span>
                  <strong>
                    {result.yield.toFixed(1)}{' '}
                    <small>{t('ai.unit')}</small>
                  </strong>
                </div>
              </article>
              <article className="ai-panel__kpi">
                <div className="ai-panel__kpi-icon is-conf">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <span>{t('ai.confidence')}</span>
                  <strong>{Math.round(result.confidence * 100)}%</strong>
                </div>
              </article>
            </div>

            <section className="ai-panel__block">
              <h3>{t('ai.metrics')}</h3>
              <p className="ai-panel__block-hint">{t('ai.metricsHint')}</p>
              <ul className="ai-panel__metrics">
                <li>
                  <span>R²</span>
                  <b>{result.r2.toFixed(2)}</b>
                </li>
                <li>
                  <span>MAE</span>
                  <b>{result.mae.toFixed(2)}</b>
                </li>
                <li>
                  <span>RMSE</span>
                  <b>{result.rmse.toFixed(2)}</b>
                </li>
              </ul>
            </section>

            <section className="ai-panel__block">
              <h3>{t('ai.features')}</h3>
              <p className="ai-panel__block-hint">{t('ai.featuresHint')}</p>
              <div className="ai-panel__bars">
                {featureImportance.map((f) => (
                  <div key={f.key} className="ai-panel__bar">
                    <div className="ai-panel__bar-top">
                      <span>{t(`ai.feature.${f.key}`)}</span>
                      <b>{Math.round(f.weight * 100)}%</b>
                    </div>
                    <div className="ai-panel__bar-track">
                      <span style={{ width: `${f.weight * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          <div className="ai-panel__empty">{t('ai.empty')}</div>
        )}
      </div>
    </aside>
  )
}
