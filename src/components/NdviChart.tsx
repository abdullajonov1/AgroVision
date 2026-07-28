import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { ndviSeries } from '../data'
import { useI18n } from '../i18n/I18nContext'
import { useVegIndex, type VegIndex } from '../context/IndexContext'
import './NdviChart.css'

const indices: VegIndex[] = ['NDVI', 'EVI', 'SAVI', 'NDWI']

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

export function NdviChart() {
  const { t } = useI18n()
  const { index, setIndex } = useVegIndex()
  const bodyRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 600, height: 180 })
  const [hover, setHover] = useState<{ x: number; y: number; value: number; date: string } | null>(
    null,
  )

  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) {
        setSize({ width: Math.round(width), height: Math.round(height) })
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { width, height } = size
  const pad = { top: 10, right: 6, bottom: 26, left: 34 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom

  const points = useMemo(
    () =>
      ndviSeries.map((d, i) => {
        const x = pad.left + (i / (ndviSeries.length - 1)) * innerW
        const y = pad.top + (1 - d.value) * innerH
        return { ...d, x, y }
      }),
    [innerW, innerH, pad.left, pad.top],
  )

  const line = smoothPath(points)
  const area = `${line} L ${points[points.length - 1].x} ${pad.top + innerH} L ${points[0].x} ${pad.top + innerH} Z`
  const last = points[points.length - 1]
  const active = hover ?? { x: last.x, y: last.y, value: last.value, date: last.date }
  const yTicks = [0, 0.25, 0.5, 0.75, 1]
  const title = t('ndvi.title').replace('{index}', index)
  const delta = last.value - ndviSeries[0].value
  const tooltipW = 72
  const tooltipX = Math.min(Math.max(active.x - tooltipW / 2, pad.left), width - pad.right - tooltipW)
  const tooltipY = Math.max(active.y - 44, 6)

  return (
    <section className="ndvi-chart">
      <div className="ndvi-chart__header">
        <div className="ndvi-chart__title-wrap">
          <h2>{title}</h2>
          <div className="ndvi-chart__meta">
            <span className="ndvi-chart__live">
              {active.value.toFixed(2)}
              <small>{active.date}</small>
            </span>
            <span className={`ndvi-chart__delta${delta >= 0 ? ' is-up' : ' is-down'}`}>
              {delta >= 0 ? '+' : ''}
              {delta.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="ndvi-chart__controls">
          <div className="ndvi-chart__tabs" role="tablist">
            {indices.map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={item === index}
                className={item === index ? 'is-active' : ''}
                onClick={() => setIndex(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <button type="button" className="ndvi-chart__period">
            {t('ndvi.period')} <ChevronDown size={14} />
          </button>
        </div>
      </div>

      <div className="ndvi-chart__body" ref={bodyRef}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="ndvi-chart__svg"
          role="img"
          preserveAspectRatio="none"
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="ndviFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2fbf5b" stopOpacity="0.38" />
              <stop offset="60%" stopColor="#2fbf5b" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#2fbf5b" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="ndviStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6dd68a" />
              <stop offset="50%" stopColor="#2fbf5b" />
              <stop offset="100%" stopColor="#15803d" />
            </linearGradient>
            <filter id="ndviGlow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#2fbf5b" floodOpacity="0.4" />
            </filter>
          </defs>

          {yTicks.map((tick) => {
            const y = pad.top + (1 - tick) * innerH
            return (
              <g key={tick}>
                <line
                  x1={pad.left}
                  x2={width - pad.right}
                  y1={y}
                  y2={y}
                  stroke="var(--border)"
                  strokeWidth="1"
                  strokeDasharray={tick === 0 ? '0' : '3 6'}
                  strokeOpacity="0.7"
                />
                <text
                  x={pad.left - 6}
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

          <path d={area} fill="url(#ndviFill)" />
          <path
            d={line}
            fill="none"
            stroke="url(#ndviStroke)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#ndviGlow)"
          />

          <line
            x1={active.x}
            x2={active.x}
            y1={pad.top}
            y2={pad.top + innerH}
            stroke="#2fbf5b"
            strokeOpacity="0.3"
            strokeWidth="1"
            strokeDasharray="3 4"
            pointerEvents="none"
          />

          {points.map((p) => (
            <g key={p.date}>
              <rect
                x={p.x - innerW / (ndviSeries.length - 1) / 2}
                y={pad.top}
                width={innerW / (ndviSeries.length - 1)}
                height={innerH}
                fill="transparent"
                className="ndvi-chart__hit"
                onMouseEnter={() =>
                  setHover({ x: p.x, y: p.y, value: p.value, date: p.date })
                }
              />
              <circle
                cx={p.x}
                cy={p.y}
                r={hover?.date === p.date || (!hover && p.date === last.date) ? 5 : 3}
                fill={
                  hover?.date === p.date || (!hover && p.date === last.date)
                    ? '#2fbf5b'
                    : 'var(--surface)'
                }
                stroke="#2fbf5b"
                strokeWidth="2"
                pointerEvents="none"
              />
            </g>
          ))}

          <g pointerEvents="none">
            <rect
              x={tooltipX}
              y={tooltipY}
              width={tooltipW}
              height="32"
              rx="8"
              fill="#0f2418"
              opacity="0.92"
            />
            <text
              x={tooltipX + tooltipW / 2}
              y={tooltipY + 14}
              textAnchor="middle"
              fontSize="12"
              fontWeight="800"
              fill="#fff"
              fontFamily="Manrope, sans-serif"
            >
              {active.value.toFixed(2)}
            </text>
            <text
              x={tooltipX + tooltipW / 2}
              y={tooltipY + 26}
              textAnchor="middle"
              fontSize="9"
              fontWeight="600"
              fill="rgba(255,255,255,0.65)"
              fontFamily="Manrope, sans-serif"
            >
              {active.date}
            </text>
          </g>

          {points.map((p, i) => (
            <text
              key={`x-${p.date}`}
              x={p.x}
              y={height - 6}
              textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}
              fontSize="10"
              fill="var(--text-light)"
              fontFamily="Manrope, sans-serif"
              fontWeight="600"
            >
              {p.date}
            </text>
          ))}
        </svg>
      </div>
    </section>
  )
}
