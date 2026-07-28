import { useEffect, useMemo, useRef, useState } from 'react'
import { Wheat, Flower2, Bean, Leaf, CircleDot } from 'lucide-react'
import { crops } from '../data'
import { useI18n } from '../i18n/I18nContext'
import './CropDistribution.css'

const cropIcons = {
  wheat: Wheat,
  cotton: Flower2,
  corn: Bean,
  rice: Leaf,
  other: CircleDot,
} as const

function polar(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function lighten(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.min(255, ((n >> 16) & 0xff) + amount)
  const g = Math.min(255, ((n >> 8) & 0xff) + amount)
  const b = Math.min(255, (n & 0xff) + amount)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

function darken(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.max(0, ((n >> 16) & 0xff) - amount)
  const g = Math.max(0, ((n >> 8) & 0xff) - amount)
  const b = Math.max(0, (n & 0xff) - amount)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

export function CropDistribution() {
  const { t } = useI18n()
  const chartWrapRef = useRef<HTMLDivElement>(null)
  const [chartSize, setChartSize] = useState(180)
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const el = chartWrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      // Always fit inside the wrap — never overflow / scroll
      const side = Math.floor(Math.min(width, height))
      setChartSize(Math.max(80, side))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const segments = useMemo(() => {
    let angle = 0
    return crops.map((crop) => {
      const start = angle
      const sweep = (crop.percent / 100) * 360
      const end = angle + sweep
      angle = end
      return { ...crop, start, end, mid: start + sweep / 2 }
    })
  }, [])

  const activeCrop = segments.find((c) => c.key === active) ?? null
  const centerLabel = activeCrop
    ? {
        pct: `${activeCrop.percent}%`,
        area: activeCrop.area,
        name: t(`crops.${activeCrop.key}`),
        color: activeCrop.color,
      }
    : {
        pct: '100%',
        area: '771 795.9 га',
        name: t('crops.all'),
        color: '#2fbf5b',
      }

  const cx = chartSize / 2
  const cy = chartSize / 2
  // Thinner ring → larger center hole (less squeeze at laptop 100%)
  const radius = chartSize * 0.36
  const trackWidth = Math.max(12, Math.min(22, chartSize * 0.09))
  const activeWidth = trackWidth + 3
  const circumference = 2 * Math.PI * radius
  const gapPx = Math.max(5, chartSize * 0.025)
  const showSliceLabels = chartSize >= 190
  const holeR = radius - trackWidth * 0.78
  const centerPctSize = Math.max(13, Math.min(22, holeR * 0.42))
  const centerMetaSize = Math.max(8, Math.min(11, holeR * 0.2))

  return (
    <section className="crops">
      <div className="crops__header">
        <h2>{t('crops.title')}</h2>
        <span className="crops__badge">{segments.length}</span>
      </div>

      <div className="crops__body">
        <div className="crops__chart-wrap" ref={chartWrapRef}>
          <div className="crops__chart" style={{ width: chartSize, height: chartSize }}>
            <div className="crops__glow" aria-hidden style={{ background: centerLabel.color }} />

            <svg
              viewBox={`0 0 ${chartSize} ${chartSize}`}
              className="crops__svg"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden
            >
              <defs>
                {segments.map((seg) => {
                  const mid = polar(cx, cy, radius, seg.mid)
                  return (
                    <linearGradient
                      key={`grad-${seg.key}`}
                      id={`cropGrad-${seg.key}`}
                      x1={cx}
                      y1={cy}
                      x2={mid.x}
                      y2={mid.y}
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop offset="0%" stopColor={lighten(seg.color, 45)} />
                      <stop offset="55%" stopColor={seg.color} />
                      <stop offset="100%" stopColor={darken(seg.color, 25)} />
                    </linearGradient>
                  )
                })}
                <filter id="cropGlow" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="cropSoft" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.2" />
                </filter>
              </defs>

              {/* soft outer halo */}
              <circle
                cx={cx}
                cy={cy}
                r={radius + trackWidth * 0.7}
                fill="none"
                stroke="var(--border)"
                strokeWidth="1"
                strokeOpacity="0.35"
              />

              {/* track ring */}
              <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke="var(--border)"
                strokeWidth={trackWidth}
                strokeOpacity="0.35"
              />

              {segments.map((seg) => {
                const isActive = active === seg.key
                const dimmed = active != null && !isActive
                const arcLen = Math.max(0, (seg.percent / 100) * circumference - gapPx)
                const offset = -(seg.start / 360) * circumference + gapPx / 2
                const strokeW = isActive ? activeWidth : trackWidth

                return (
                  <g key={seg.key}>
                    {isActive ? (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={radius}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth={strokeW + 6}
                        strokeLinecap="round"
                        strokeDasharray={`${arcLen} ${circumference}`}
                        strokeDashoffset={offset}
                        strokeOpacity="0.2"
                        transform={`rotate(-90 ${cx} ${cy})`}
                        className="crops__slice-halo"
                      />
                    ) : null}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={radius}
                      fill="none"
                      stroke={`url(#cropGrad-${seg.key})`}
                      strokeWidth={strokeW}
                      strokeLinecap="round"
                      strokeDasharray={`${arcLen} ${circumference}`}
                      strokeDashoffset={offset}
                      transform={`rotate(-90 ${cx} ${cy})`}
                      className={`crops__slice${isActive ? ' is-active' : ''}${dimmed ? ' is-dim' : ''}`}
                      filter={isActive ? 'url(#cropGlow)' : 'url(#cropSoft)'}
                      onMouseEnter={() => setActive(seg.key)}
                      onMouseLeave={() => setActive(null)}
                    />
                  </g>
                )
              })}

              {showSliceLabels
                ? segments
                    .filter((s) => s.percent >= 15)
                    .map((seg) => {
                      const p = polar(cx, cy, radius, seg.mid)
                      const show = active == null || active === seg.key
                      return (
                        <g
                          key={`lbl-${seg.key}`}
                          opacity={show ? 1 : 0.2}
                          style={{ transition: 'opacity 0.2s' }}
                          pointerEvents="none"
                        >
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={Math.max(8, chartSize * 0.045)}
                            fill="var(--surface)"
                            stroke={seg.color}
                            strokeWidth="1.5"
                          />
                          <text
                            x={p.x}
                            y={p.y + 3}
                            textAnchor="middle"
                            fontSize={Math.max(8, chartSize * 0.042)}
                            fontWeight="800"
                            fill="var(--text)"
                            fontFamily="Manrope, sans-serif"
                          >
                            {Math.round(seg.percent)}
                          </text>
                        </g>
                      )
                    })
                : null}

              <circle
                cx={cx}
                cy={cy}
                r={holeR}
                fill="var(--surface)"
                filter="url(#cropSoft)"
              />
              <circle
                cx={cx}
                cy={cy}
                r={holeR}
                fill="none"
                stroke={centerLabel.color}
                strokeWidth="1.5"
                strokeOpacity="0.3"
              />
            </svg>

            <div
              className="crops__center"
              key={centerLabel.name}
              style={{
                inset: `${((chartSize / 2 - holeR * 0.85) / chartSize) * 100}%`,
              }}
            >
              <strong
                style={{
                  color: activeCrop ? centerLabel.color : undefined,
                  fontSize: centerPctSize,
                }}
              >
                {centerLabel.pct}
              </strong>
              <span style={{ fontSize: centerMetaSize }}>{centerLabel.area}</span>
              <em style={{ fontSize: centerMetaSize }}>{centerLabel.name}</em>
            </div>
          </div>
        </div>

        <ul className="crops__legend">
          {segments.map((crop) => {
            const Icon = cropIcons[crop.icon as keyof typeof cropIcons] ?? CircleDot
            const isActive = active === crop.key
            return (
              <li
                key={crop.key}
                className={isActive ? 'is-active' : ''}
                onMouseEnter={() => setActive(crop.key)}
                onMouseLeave={() => setActive(null)}
              >
                <div
                  className="crops__legend-icon"
                  style={{
                    background: `linear-gradient(145deg, ${lighten(crop.color, 35)}, ${crop.color})`,
                    color: '#fff',
                    boxShadow: isActive ? `0 4px 12px ${crop.color}55` : undefined,
                  }}
                >
                  <Icon size={13} />
                </div>
                <div className="crops__legend-info">
                  <div className="crops__legend-top">
                    <strong className="crops__legend-name">{t(`crops.${crop.key}`)}</strong>
                    <span className="crops__legend-area">{crop.area}</span>
                    <b
                      className="crops__legend-pct"
                      style={{ color: isActive ? crop.color : undefined }}
                    >
                      {crop.percent}%
                    </b>
                  </div>
                  <div className="crops__legend-bar">
                    <span
                      style={{
                        width: `${crop.percent}%`,
                        background: `linear-gradient(90deg, ${lighten(crop.color, 25)}, ${darken(crop.color, 10)})`,
                      }}
                    />
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
