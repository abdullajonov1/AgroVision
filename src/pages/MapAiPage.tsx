import { MapPanel } from '../components/MapPanel'
import { AiForecastPanel } from '../components/AiForecastPanel'
import './MapAiPage.css'

export function MapAiPage() {
  return (
    <div className="map-ai">
      <div className="map-ai__map">
        <MapPanel tools />
      </div>
      <AiForecastPanel />
    </div>
  )
}
