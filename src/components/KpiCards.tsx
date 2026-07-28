import {
  Sprout,
  LayoutGrid,
  TrendingUp,
  Wheat,
  ShieldAlert,
  Bell,
} from 'lucide-react'
import { kpiCards } from '../data'
import { useI18n } from '../i18n/I18nContext'
import './KpiCards.css'

const icons = {
  sprout: Sprout,
  grid: LayoutGrid,
  chart: TrendingUp,
  wheat: Wheat,
  shield: ShieldAlert,
  bell: Bell,
} as const

export function KpiCards() {
  const { t } = useI18n()

  return (
    <section className="kpi" aria-label="KPI">
      {kpiCards.map((card) => {
        const Icon = icons[card.icon as keyof typeof icons]
        return (
          <article key={card.id} className="kpi-card">
            <div className={`kpi-card__icon kpi-card__icon--${card.id}`}>
              <Icon size={13} strokeWidth={2.2} />
            </div>
            <div className="kpi-card__content">
              <div className="kpi-card__label">{t(card.labelKey)}</div>
              <div className="kpi-card__row">
                <div className="kpi-card__value">{card.value}</div>
                {card.trendType === 'link' ? (
                  <button type="button" className="kpi-card__link">
                    {t(card.trendKey)}
                  </button>
                ) : (
                  <div className={`kpi-card__trend kpi-card__trend--${card.trendType}`}>
                    {card.trendValue}
                  </div>
                )}
              </div>
            </div>
          </article>
        )
      })}
    </section>
  )
}
