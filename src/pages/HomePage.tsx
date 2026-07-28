import { KpiCards } from '../components/KpiCards'
import { MapPanel } from '../components/MapPanel'
import { RegionStats } from '../components/RegionStats'
import { NdviChart } from '../components/NdviChart'
import { CropDistribution } from '../components/CropDistribution'

export function HomePage() {
  return (
    <div className="app__dashboard">
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
