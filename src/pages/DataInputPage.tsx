import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Wheat, Flower2, MapPinned, CalendarRange, Save, RotateCcw, CircleHelp } from 'lucide-react'
import { useI18n } from '../i18n/I18nContext'
import { useGeo } from '../context/GeoContext'
import { regionStats } from '../data'
import { InputMap } from '../components/InputMap'
import './pages.css'
import './DataInputPage.css'

type Errors = Partial<Record<'crop' | 'region' | 'district' | 'field' | 'area' | 'dates', string>>

export function DataInputPage() {
  const { t } = useI18n()
  const { districts } = useGeo()
  const [crop, setCrop] = useState('')
  const [region, setRegion] = useState('')
  const [district, setDistrict] = useState('')
  const [fieldId, setFieldId] = useState('')
  const [area, setArea] = useState('')
  const [from, setFrom] = useState('2025-03-01')
  const [to, setTo] = useState('2025-06-09')
  const [errors, setErrors] = useState<Errors>({})
  const [ok, setOk] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [job, setJob] = useState<'idle' | 'queued' | 'running' | 'done'>('idle')
  const jobTimers = useRef<number[]>([])

  const regions = useMemo(
    () => regionStats.map((r) => ({ id: r.id, label: t(`region.${r.id}`) })),
    [t],
  )

  const districtOptions = useMemo(() => {
    if (!districts) return []
    return districts.features
      .filter((f) => f.properties.regionId === region)
      .map((f) => ({
        id: String(f.properties.id),
        label: f.properties.name_en,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [districts, region])

  useEffect(() => {
    return () => {
      jobTimers.current.forEach((id) => window.clearTimeout(id))
    }
  }, [])

  useEffect(() => {
    if (!district || !districts) return
    const ok = districts.features.some(
      (f) => String(f.properties.id) === district && f.properties.regionId === region,
    )
    if (!ok) {
      setDistrict('')
      setFieldId('')
    }
  }, [region, district, districts])

  const reset = () => {
    setCrop('')
    setRegion('')
    setDistrict('')
    setFieldId('')
    setArea('')
    setFrom('2025-03-01')
    setTo('2025-06-09')
    setErrors({})
    setOk(false)
    jobTimers.current.forEach((id) => window.clearTimeout(id))
    jobTimers.current = []
    setJob('idle')
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const next: Errors = {}
    if (!crop) next.crop = t('input.err.crop')
    if (!region) next.region = t('input.err.region')
    if (!district) next.district = t('input.err.district')
    if (!fieldId) next.field = t('input.err.field')
    if (!area || Number(area) <= 0) next.area = t('input.err.area')
    if (!from || !to || from > to) next.dates = t('input.err.dates')
    setErrors(next)
    if (Object.keys(next).length) {
      setOk(false)
      setJob('idle')
      return
    }
    setOk(false)
    setJob('queued')
    jobTimers.current.forEach((id) => window.clearTimeout(id))
    jobTimers.current = [
      window.setTimeout(() => setJob('running'), 400),
      window.setTimeout(() => {
        setJob('done')
        setOk(true)
      }, 1200),
    ]
  }

  const fieldDisplay = fieldId
    ? t('input.fieldValue').replace('{n}', fieldId.split('-').pop()?.replace(/^f/, '') ?? fieldId)
    : ''

  return (
    <div className="input-page page">
      {ok ? <div className="input-page__toast">{t('input.success')}</div> : null}

      <div className="input-layout">
        <form className="input-panel" onSubmit={onSubmit}>
          <header className="input-panel__head">
            <div>
              <h2>{t('input.title')}</h2>
              <p>{t('input.hint')}</p>
            </div>
            <button
              type="button"
              className="input-guide-btn"
              onClick={() => setGuideOpen((v) => !v)}
            >
              <CircleHelp size={14} />
              {t('input.guide')}
            </button>
          </header>

          <div className={`input-job input-job--${job}`}>
            <span>{t('input.status.label')}</span>
            <b>{t(`input.status.${job}`)}</b>
          </div>
          {guideOpen ? <p className="input-guide">{t('input.guide.body')}</p> : null}

          <div className="input-panel__body">
            <section className="input-section">
              <div className="input-section__label">
                <Wheat size={16} />
                <div>
                  <h3>{t('input.section.crop')}</h3>
                  <p>{t('input.section.cropHint')}</p>
                </div>
              </div>
              <div className="input-section__fields">
                <div className="input-crops" role="group" aria-label={t('input.crop')}>
                  <button
                    type="button"
                    className={`input-crop${crop === 'wheat' ? ' is-active' : ''}`}
                    onClick={() => setCrop('wheat')}
                  >
                    <Wheat size={16} />
                    {t('ai.crop.wheat')}
                  </button>
                  <button
                    type="button"
                    className={`input-crop${crop === 'cotton' ? ' is-active' : ''}`}
                    onClick={() => setCrop('cotton')}
                  >
                    <Flower2 size={16} />
                    {t('ai.crop.cotton')}
                  </button>
                </div>
                {errors.crop ? <span className="field-error">{errors.crop}</span> : null}
              </div>
            </section>

            <section className="input-section">
              <div className="input-section__label">
                <MapPinned size={16} />
                <div>
                  <h3>{t('input.section.place')}</h3>
                  <p>{t('input.section.placeHint')}</p>
                </div>
              </div>
              <div className="input-section__fields">
                <div className="input-section__fields--2">
                  <div className="field">
                    <label>{t('input.region')}</label>
                    <select
                      value={region}
                      onChange={(e) => {
                        setRegion(e.target.value)
                        setDistrict('')
                        setFieldId('')
                      }}
                      className={!region ? 'is-empty' : undefined}
                    >
                      <option value="">{t('input.regionPh')}</option>
                      {regions.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    {errors.region ? <span className="field-error">{errors.region}</span> : null}
                  </div>
                  <div className="field">
                    <label>{t('input.district')}</label>
                    <select
                      value={district}
                      onChange={(e) => {
                        setDistrict(e.target.value)
                        setFieldId('')
                      }}
                      disabled={!region || !districtOptions.length}
                      className={!district ? 'is-empty' : undefined}
                    >
                      <option value="">{t('input.districtPh')}</option>
                      {districtOptions.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                    {errors.district ? (
                      <span className="field-error">{errors.district}</span>
                    ) : null}
                  </div>
                </div>
                <div className="field">
                  <label>{t('input.field')}</label>
                  <div className={`input-field-ro${!fieldId ? ' is-empty' : ''}`}>
                    {fieldDisplay || t('input.fieldPh')}
                  </div>
                  <small className="field-hint">{t('input.fieldHint')}</small>
                  {errors.field ? <span className="field-error">{errors.field}</span> : null}
                </div>
                <div className="field">
                  <label>{t('input.area')}</label>
                  <div className="input-unit">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="0"
                    />
                    <span>{t('input.unit.ha')}</span>
                  </div>
                  <small className="field-hint">{t('input.areaHint')}</small>
                  {errors.area ? <span className="field-error">{errors.area}</span> : null}
                </div>
              </div>
            </section>

            <section className="input-section input-section--last">
              <div className="input-section__label">
                <CalendarRange size={16} />
                <div>
                  <h3>{t('input.section.period')}</h3>
                  <p>{t('input.section.periodHint')}</p>
                </div>
              </div>
              <div className="input-section__fields input-section__fields--2">
                <div className="field">
                  <label>{t('input.from')}</label>
                  <div className="input-date">
                    <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                  </div>
                </div>
                <div className="field">
                  <label>{t('input.to')}</label>
                  <div className="input-date">
                    <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                  </div>
                  {errors.dates ? <span className="field-error">{errors.dates}</span> : null}
                </div>
              </div>
            </section>
          </div>

          <footer className="input-panel__footer">
            <button type="button" className="btn btn--ghost" onClick={reset}>
              <RotateCcw size={15} />
              {t('input.reset')}
            </button>
            <button type="submit" className="btn btn--primary">
              <Save size={15} />
              {t('input.submit')}
            </button>
          </footer>
        </form>

        <InputMap
          regionId={region}
          districtId={district}
          fieldId={fieldId}
          onSelectRegion={(id) => {
            setRegion(id)
            setDistrict('')
            setFieldId('')
          }}
          onSelectDistrict={(regionId, districtId) => {
            setRegion(regionId)
            setDistrict(districtId)
            setFieldId('')
          }}
          onSelectField={(id) => setFieldId(id)}
        />
      </div>
    </div>
  )
}
