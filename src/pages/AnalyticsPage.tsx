import { useEffect, useMemo, useRef, useState } from 'react'
import { Activity, TrendingUp, Wheat, Flower2 } from 'lucide-react'
import { useI18n } from '../i18n/I18nContext'
import { analyticsYieldSeries, ndviSeries } from '../data'
import './pages.css'
import './AnalyticsPage.css'

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return ''
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }
  return d
}

export function AnalyticsPage() {
  const { t } = useI18n()
  const barRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)
  const [barSize, setBarSize] = useState({ width: 520, height: 240 })
  const [lineSize, setLineSize] = useState({ width: 520, height: 240 })
  const [hoverBar, setHoverBar] = useState<number | null>(null)
  const [hoverNdvi, setHoverNdvi] = useState<number | null>(null)

  useEffect(() => {
    const observe = (
      el: HTMLDivElement | null,
      set: (s: { width: number; height: number }) => void,
    ) => {
      if (!el) return () => {}
      const ro = new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0) set({ width: Math.round(width), height: Math.round(height) })
      })
      ro.observe(el)
      return () => ro.disconnect()
    }
    const a = observe(barRef.current, setBarSize)
    const b = observe(lineRef.current, setLineSize)
    return () => {
      a()
      b()
    }
  }, [])

  const maxY = Math.max(...analyticsYieldSeries.flatMap((d) => [d.wheat, d.cotton]), 1)
  const yCeil = Math.ceil(maxY * 10) / 10
  const lastNdvi = ndviSeries[ndviSeries.length - 1]
  const firstNdvi = ndviSeries[0]
  const ndviDelta = lastNdvi.value - firstNdvi.value
  const wheatDelta = analyticsYieldSeries[analyticsYieldSeries.length - 1].wheat - analyticsYieldSeries[0].wheat
  const cottonDelta = analyticsYieldSeries[analyticsYieldSeries.length - 1].cotton - analyticsYieldSeries[0].cotton

  const barPad = { top: 18, right: 12, bottom: 28, left: 36 }
  const barInnerW = barSize.width - barPad.left - barPad.right
  const barInnerH = barSize.height - barPad.top - barPad.bottom
  const groupW = barInnerW / analyticsYieldSeries.length
  const barW = Math.min(22, groupW * 0.28)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * yCeil)

  const linePad = { top: 16, right: 10, bottom: 28, left: 36 }
  const lineInnerW = lineSize.width - linePad.left - linePad.right
  const lineInnerH = lineSize.height - linePad.top - linePad.bottom

  const ndviPoints = useMemo(
    () =>
      ndviSeries.map((d, i) => {
        const x = linePad.left + (i / (ndviSeries.length - 1)) * lineInnerW
        const y = linePad.top + (1 - d.value) * lineInnerH
        return { ...d, x, y }
      }),
    [lineInnerW, lineInnerH, linePad.left, linePad.top],
  )

  const linePath = smoothPath(ndviPoints)
  const areaPath = ndviPoints.length
    ? `${linePath} L ${ndviPoints[ndviPoints.length - 1].x} ${linePad.top + lineInnerH} L ${ndviPoints[0].x} ${linePad.top + lineInnerH} Z`
    : ''
  const activeNdvi = hoverNdvi != null ? ndviPoints[hoverNdvi] : ndviPoints[ndviPoints.length - 1]
  const ndviTicks = [0, 0.25, 0.5, 0.75, 1]

  const kpis = [
    {
      key: 'ndvi',
      label: t('analytics.ndvi'),
      value: lastNdvi.value.toFixed(2),
      delta: `${ndviDelta >= 0 ? '+' : ''}${ndviDelta.toFixed(2)}`,
      up: ndviDelta >= 0,
      icon: Activity,
      tone: 'green' as const,
    },
    {
      key: 'wheat',
      label: t('analytics.yieldWheat'),
      value: '4.9',
      delta: `+${wheatDelta.toFixed(1)}`,
      up: true,
      icon: Wheat,
      tone: 'lime' as const,
    },
    {
      key: 'cotton',
      label: t('analytics.yieldCotton'),
      value: '3.1',
      delta: `+${cottonDelta.toFixed(1)}`,
      up: true,
      icon: Flower2,
      tone: 'gold' as const,
    },
  ]

  return (
    <div className="analytics page">
      <div className="analytics__kpis">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <article key={kpi.key} className={`analytics-kpi analytics-kpi--${kpi.tone}`}>
              <div className="analytics-kpi__icon">
                <Icon size={18} strokeWidth={2.2} />
              </div>
              <div className="analytics-kpi__body">
                <span>{kpi.label}</span>
                <div className="analytics-kpi__row">
                  <strong>{kpi.value}</strong>
                  <em className={kpi.up ? 'is-up' : 'is-down'}>{kpi.delta}</em>
                </div>
              </div>
              <TrendingUp size={16} className="analytics-kpi__trend" aria-hidden />
            </article>
          )
        })}
      </div>

      <div className="analytics__charts">
        <section className="analytics-card">
          <div className="analytics-card__header">
            <div>
              <h2>{t('analytics.chart')}</h2>
              <p>{t('analytics.chartHint')}</p>
            </div>
            <div className="analytics-legend">
              <span>
                <i className="is-wheat" /> {t('ai.crop.wheat')}
              </span>
              <span>
                <i className="is-cotton" /> {t('ai.crop.cotton')}
              </span>
            </div>
          </div>

          <div className="analytics-card__body" ref={barRef}>
            <svg
              viewBox={`0 0 ${barSize.width} ${barSize.height}`}
              className="analytics-svg"
              preserveAspectRatio="none"
              role="img"
            >
              <defs>
                <linearGradient id="wheatBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4fd06e" />
                  <stop offset="100%" stopColor="#1f9d4b" />
                </linearGradient>
                <linearGradient id="cottonBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f5d06a" />
                  <stop offset="100%" stopColor="#e0a820" />
                </linearGradient>
              </defs>

              {yTicks.map((tick) => {
                const y = barPad.top + (1 - tick / yCeil) * barInnerH
                return (
                  <g key={tick}>
                    <line
                      x1={barPad.left}
                      x2={barSize.width - barPad.right}
                      y1={y}
                      y2={y}
                      stroke="var(--border)"
                      strokeDasharray={tick === 0 ? '0' : '3 5'}
                      strokeOpacity="0.75"
                    />
                    <text
                      x={barPad.left - 8}
                      y={y + 3.5}
                      textAnchor="end"
                      fontSize="10"
                      fill="var(--text-light)"
                      fontFamily="Manrope, sans-serif"
                      fontWeight="600"
                    >
                      {tick.toFixed(1)}
                    </text>
                  </g>
                )
              })}

              {analyticsYieldSeries.map((d, i) => {
                const cx = barPad.left + i * groupW + groupW / 2
                const wheatH = (d.wheat / yCeil) * barInnerH
                const cottonH = (d.cotton / yCeil) * barInnerH
                const active = hoverBar === i
                return (
                  <g
                    key={d.label}
                    onMouseEnter={() => setHoverBar(i)}
                    onMouseLeave={() => setHoverBar(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    <rect
                      x={cx - groupW / 2}
                      y={barPad.top}
                      width={groupW}
                      height={barInnerH}
                      fill="transparent"
                    />
                    <rect
                      x={cx - barW - 3}
                      y={barPad.top + barInnerH - wheatH}
                      width={barW}
                      height={wheatH}
                      rx="5"
                      fill="url(#wheatBar)"
                      opacity={active || hoverBar == null ? 1 : 0.45}
                    />
                    <rect
                      x={cx + 3}
                      y={barPad.top + barInnerH - cottonH}
                      width={barW}
                      height={cottonH}
                      rx="5"
                      fill="url(#cottonBar)"
                      opacity={active || hoverBar == null ? 1 : 0.45}
                    />
                    <text
                      x={cx}
                      y={barSize.height - 8}
                      textAnchor="middle"
                      fontSize="11"
                      fill="var(--text-muted)"
                      fontFamily="Manrope, sans-serif"
                      fontWeight="700"
                    >
                      {d.label}
                    </text>
                    {active ? (
                      <g>
                        <rect
                          x={cx - 42}
                          y={barPad.top + 2}
                          width="84"
                          height="34"
                          rx="8"
                          fill="#0f2418"
                          opacity="0.92"
                        />
                        <text
                          x={cx}
                          y={barPad.top + 16}
                          textAnchor="middle"
                          fontSize="10"
                          fill="#7dd87f"
                          fontFamily="Manrope, sans-serif"
                          fontWeight="700"
                        >
                          {d.wheat.toFixed(1)} t/га
                        </text>
                        <text
                          x={cx}
                          y={barPad.top + 28}
                          textAnchor="middle"
                          fontSize="10"
                          fill="#f0c14a"
                          fontFamily="Manrope, sans-serif"
                          fontWeight="700"
                        >
                          {d.cotton.toFixed(1)} t/га
                        </text>
                      </g>
                    ) : null}
                  </g>
                )
              })}
            </svg>
          </div>
        </section>

        <section className="analytics-card">
          <div className="analytics-card__header">
            <div>
              <h2>{t('analytics.ndvi')}</h2>
              <p>{t('analytics.ndviHint')}</p>
            </div>
            <div className="analytics-card__meta">
              <strong>{activeNdvi?.value.toFixed(2)}</strong>
              <span className={ndviDelta >= 0 ? 'is-up' : 'is-down'}>
                {ndviDelta >= 0 ? '+' : ''}
                {ndviDelta.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="analytics-card__body" ref={lineRef}>
            <svg
              viewBox={`0 0 ${lineSize.width} ${lineSize.height}`}
              className="analytics-svg"
              preserveAspectRatio="none"
              role="img"
              onMouseLeave={() => setHoverNdvi(null)}
            >
              <defs>
                <linearGradient id="analyticsNdviFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2fbf5b" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#2fbf5b" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="analyticsNdviStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6dd68a" />
                  <stop offset="100%" stopColor="#15803d" />
                </linearGradient>
              </defs>

              {ndviTicks.map((tick) => {
                const y = linePad.top + (1 - tick) * lineInnerH
                return (
                  <g key={tick}>
                    <line
                      x1={linePad.left}
                      x2={lineSize.width - linePad.right}
                      y1={y}
                      y2={y}
                      stroke="var(--border)"
                      strokeDasharray={tick === 0 ? '0' : '3 5'}
                      strokeOpacity="0.75"
                    />
                    <text
                      x={linePad.left - 8}
                      y={y + 3.5}
                      textAnchor="end"
                      fontSize="10"
                      fill="var(--text-light)"
                      fontFamily="Manrope, sans-serif"
                      fontWeight="600"
                    >
                      {tick.toFixed(2)}
                    </text>
                  </g>
                )
              })}

              <path d={areaPath} fill="url(#analyticsNdviFill)" />
              <path
                d={linePath}
                fill="none"
                stroke="url(#analyticsNdviStroke)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {activeNdvi ? (
                <line
                  x1={activeNdvi.x}
                  x2={activeNdvi.x}
                  y1={linePad.top}
                  y2={linePad.top + lineInnerH}
                  stroke="#2fbf5b"
                  strokeOpacity="0.3"
                  strokeDasharray="3 4"
                />
              ) : null}

              {ndviPoints.map((p, i) => (
                <g key={p.date}>
                  <rect
                    x={p.x - lineInnerW / (ndviSeries.length - 1) / 2}
                    y={linePad.top}
                    width={lineInnerW / (ndviSeries.length - 1)}
                    height={lineInnerH}
                    fill="transparent"
                    onMouseEnter={() => setHoverNdvi(i)}
                    style={{ cursor: 'crosshair' }}
                  />
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={hoverNdvi === i || (hoverNdvi == null && i === ndviPoints.length - 1) ? 5 : 3}
                    fill={
                      hoverNdvi === i || (hoverNdvi == null && i === ndviPoints.length - 1)
                        ? '#2fbf5b'
                        : 'var(--surface)'
                    }
                    stroke="#2fbf5b"
                    strokeWidth="2"
                    pointerEvents="none"
                  />
                  <text
                    x={p.x}
                    y={lineSize.height - 8}
                    textAnchor={
                      i === 0 ? 'start' : i === ndviPoints.length - 1 ? 'end' : 'middle'
                    }
                    fontSize="10"
                    fill="var(--text-light)"
                    fontFamily="Manrope, sans-serif"
                    fontWeight="600"
                  >
                    {p.date}
                  </text>
                </g>
              ))}

              {activeNdvi ? (
                <g pointerEvents="none">
                  <rect
                    x={Math.min(
                      Math.max(activeNdvi.x - 36, linePad.left),
                      lineSize.width - linePad.right - 72,
                    )}
                    y={Math.max(activeNdvi.y - 40, 4)}
                    width="72"
                    height="30"
                    rx="8"
                    fill="#0f2418"
                    opacity="0.92"
                  />
                  <text
                    x={Math.min(
                      Math.max(activeNdvi.x, linePad.left + 36),
                      lineSize.width - linePad.right - 36,
                    )}
                    y={Math.max(activeNdvi.y - 22, 16)}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="800"
                    fill="#fff"
                    fontFamily="Manrope, sans-serif"
                  >
                    {activeNdvi.value.toFixed(2)}
                  </text>
                </g>
              ) : null}
            </svg>
          </div>
        </section>
      </div>
    </div>
  )
}
