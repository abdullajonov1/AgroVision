import { ClipboardList, FileBarChart2, Map } from 'lucide-react'
import { KpiCards } from '../components/KpiCards'
import { MapPanel } from '../components/MapPanel'
import { RegionStats } from '../components/RegionStats'
import { NdviChart } from '../components/NdviChart'
import { CropDistribution } from '../components/CropDistribution'
import { useI18n } from '../i18n/I18nContext'
import type { NavId } from '../data'

export function HomePage({ onNavigate }: { onNavigate: (id: NavId) => void }) {
  const { t } = useI18n()

  return (
    <div className="app__dashboard">
      <nav className="home-quick" aria-label={t('home.quick.title')}>
        <span>{t('home.quick.title')}</span>
        <div className="home-quick__links">
          <button type="button" onClick={() => onNavigate('map')}>
            <Map size={15} />
            {t('home.quick.map')}
          </button>
          <button type="button" onClick={() => onNavigate('input')}>
            <ClipboardList size={15} />
            {t('home.quick.input')}
          </button>
          <button type="button" onClick={() => onNavigate('reports')}>
            <FileBarChart2 size={15} />
            {t('home.quick.reports')}
          </button>
        </div>
      </nav>
      <KpiCards />
      <div className="app__row app__row--mid">
        <MapPanel />
        <RegionStats />
      </div>
      <div className="app__row app__row--bottom">
        <NdviChart />
        <CropDistribution />
      </div>
    </div>
  )
}
