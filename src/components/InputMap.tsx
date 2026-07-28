import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  Polygon,
  Polyline,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import type { Feature, FeatureCollection, Geometry, Position } from 'geojson'
import type { Layer, LeafletMouseEvent, PathOptions } from 'leaflet'
import L from 'leaflet'
import {
  MapPinned,
  Plus,
  Minus,
  Layers,
  Map as MapIcon,
  Moon,
  Navigation,
  Satellite,
  Mountain,
  Pencil,
  Undo2,
  Eraser,
  Check,
} from 'lucide-react'
import { useI18n } from '../i18n/I18nContext'
import { useTheme } from '../theme/ThemeContext'
import { useGeo, type DistrictProps, type RegionProps } from '../context/GeoContext'
import { buildFieldsForFeatures, type FieldProps } from '../utils/fieldPolygons'
import 'leaflet/dist/leaflet.css'
import './InputMap.css'

const UZ_CENTER: [number, number] = [41.3, 64.5]
const UZ_BOUNDS = L.latLngBounds([37.1, 55.9], [45.7, 73.2])

type BasemapId = 'light' | 'dark' | 'streets' | 'satellite' | 'terrain'

const BASEMAPS: Record<BasemapId, { url: string; maxZoom?: number }> = {
  light: { url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png' },
  dark: { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' },
  streets: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19,
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    maxZoom: 17,
  },
}

type InputMapProps = {
  regionId: string
  districtId: string
  fieldId: string
  onSelectRegion: (id: string) => void
  onSelectDistrict: (regionId: string, districtId: string) => void
  onSelectField: (fieldId: string) => void
}

function shortRegionName(name: string) {
  return name
    .replace(/область|вилояти|viloyati|vil\.?|обл\.?|провинция|Республика/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function fieldLabel(id: string) {
  const part = id.split('-').pop() ?? id
  return part.replace(/^f/, '')
}

function MapReady({ onReady }: { onReady: (map: L.Map) => void }) {
  const map = useMap()
  useEffect(() => {
    onReady(map)
  }, [map, onReady])
  return null
}

function FitBounds({
  regions,
  districts,
  fields,
  regionId,
  districtId,
  fieldId,
}: {
  regions: FeatureCollection<Geometry, RegionProps> | null
  districts: FeatureCollection<Geometry, DistrictProps> | null
  fields: FeatureCollection<Geometry, FieldProps> | null
  regionId: string
  districtId: string
  fieldId: string
}) {
  const map = useMap()

  useEffect(() => {
    if (fieldId && fields) {
      const f = fields.features.find((x) => x.properties.id === fieldId)
      if (f) {
        const layer = L.geoJSON(f as Feature)
        map.fitBounds(layer.getBounds().pad(0.55), { animate: true, maxZoom: 16, padding: [40, 40] })
        return
      }
    }
    if (!regionId && !districtId) {
      map.fitBounds(UZ_BOUNDS, { animate: true, padding: [24, 24] })
      return
    }
    if (districtId && districts) {
      const f = districts.features.find((x) => String(x.properties.id) === districtId)
      if (f) {
        const layer = L.geoJSON(f as Feature)
        map.fitBounds(layer.getBounds().pad(0.18), { animate: true, maxZoom: 12 })
        return
      }
    }
    if (regionId && regions) {
      const f = regions.features.find((x) => x.properties.id === regionId)
      if (f) {
        const layer = L.geoJSON(f as Feature)
        map.fitBounds(layer.getBounds().pad(0.14), { animate: true, maxZoom: 8 })
        return
      }
    }
    map.fitBounds(UZ_BOUNDS, { animate: true, padding: [24, 24] })
  }, [map, regions, districts, fields, regionId, districtId, fieldId])

  return null
}

function InvalidateSize() {
  const map = useMap()
  useEffect(() => {
    const el = map.getContainer().parentElement
    if (!el) return
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(el)
    const t = window.setTimeout(() => map.invalidateSize(), 80)
    return () => {
      ro.disconnect()
      window.clearTimeout(t)
    }
  }, [map])
  return null
}

function DrawCapture({
  active,
  onPoint,
}: {
  active: boolean
  onPoint: (coord: Position) => void
}) {
  const map = useMap()

  useEffect(() => {
    const el = map.getContainer()
    if (active) el.classList.add('is-drawing')
    else el.classList.remove('is-drawing')
    return () => el.classList.remove('is-drawing')
  }, [map, active])

  useMapEvents({
    click(e) {
      if (!active) return
      onPoint([e.latlng.lng, e.latlng.lat])
    },
  })

  return null
}

function InputMapControls({
  map,
  basemap,
  onBasemapChange,
  drawEnabled,
  drawing,
  onToggleDraw,
  onUndo,
  onClear,
  onFinish,
  canUndo,
  canFinish,
}: {
  map: L.Map | null
  basemap: BasemapId
  onBasemapChange: (id: BasemapId) => void
  drawEnabled: boolean
  drawing: boolean
  onToggleDraw: () => void
  onUndo: () => void
  onClear: () => void
  onFinish: () => void
  canUndo: boolean
  canFinish: boolean
}) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const options: Array<{ id: BasemapId; icon: typeof MapIcon; labelKey: string }> = [
    { id: 'light', icon: MapIcon, labelKey: 'map.basemap.light' },
    { id: 'dark', icon: Moon, labelKey: 'map.basemap.dark' },
    { id: 'streets', icon: Navigation, labelKey: 'map.basemap.streets' },
    { id: 'satellite', icon: Satellite, labelKey: 'map.basemap.satellite' },
    { id: 'terrain', icon: Mountain, labelKey: 'map.basemap.terrain' },
  ]

  return (
    <div className="input-map-card__controls" ref={wrapRef}>
      <button type="button" aria-label="+" onClick={() => map?.zoomIn()}>
        <Plus size={16} />
      </button>
      <button type="button" aria-label="-" onClick={() => map?.zoomOut()}>
        <Minus size={16} />
      </button>
      <div className="input-map-card__layers">
        <button
          type="button"
          aria-label={t('map.basemap')}
          className={open ? 'is-active' : ''}
          onClick={() => setOpen((v) => !v)}
        >
          <Layers size={16} />
        </button>
        {open ? (
          <div className="input-map-card__basemap" role="menu">
            <div className="input-map-card__basemap-title">{t('map.basemap')}</div>
            {options.map((opt) => {
              const Icon = opt.icon
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={basemap === opt.id}
                  className={basemap === opt.id ? 'is-active' : ''}
                  onClick={() => {
                    onBasemapChange(opt.id)
                    setOpen(false)
                  }}
                >
                  <Icon size={15} />
                  <span>{t(opt.labelKey)}</span>
                </button>
              )
            })}
          </div>
        ) : null}
      </div>

      {drawEnabled ? (
        <>
          <button
            type="button"
            className={drawing ? 'is-active' : ''}
            aria-label={t('input.draw')}
            title={t('input.draw')}
            onClick={onToggleDraw}
          >
            <Pencil size={15} />
          </button>
          {drawing ? (
            <>
              <button
                type="button"
                aria-label={t('input.draw.undo')}
                title={t('input.draw.undo')}
                disabled={!canUndo}
                onClick={onUndo}
              >
                <Undo2 size={15} />
              </button>
              <button
                type="button"
                aria-label={t('input.draw.finish')}
                title={t('input.draw.finish')}
                disabled={!canFinish}
                onClick={onFinish}
              >
                <Check size={15} />
              </button>
              <button
                type="button"
                aria-label={t('input.draw.clear')}
                title={t('input.draw.clear')}
                onClick={onClear}
              >
                <Eraser size={15} />
              </button>
            </>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

export function InputMap({
  regionId,
  districtId,
  fieldId,
  onSelectRegion,
  onSelectDistrict,
  onSelectField,
}: InputMapProps) {
  const { t } = useI18n()
  const { theme } = useTheme()
  const { regions, districts, loading } = useGeo()
  const [ready, setReady] = useState(false)
  const [map, setMap] = useState<L.Map | null>(null)
  const [basemap, setBasemap] = useState<BasemapId>(theme === 'dark' ? 'dark' : 'light')
  const [drawing, setDrawing] = useState(false)
  const [draft, setDraft] = useState<Position[]>([])
  const [shapes, setShapes] = useState<Position[][]>([])
  const geoRef = useRef<L.GeoJSON | null>(null)
  const fieldsRef = useRef<L.GeoJSON | null>(null)
  const regionRef = useRef(regionId)
  const districtRef = useRef(districtId)
  const fieldRef = useRef(fieldId)
  regionRef.current = regionId
  districtRef.current = districtId
  fieldRef.current = fieldId

  useEffect(() => {
    setBasemap((prev) => {
      if (theme === 'dark' && (prev === 'light' || prev === 'streets')) return 'dark'
      if (theme === 'light' && prev === 'dark') return 'light'
      return prev
    })
  }, [theme])

  useEffect(() => {
    setDrawing(false)
    setDraft([])
    setShapes([])
  }, [fieldId, districtId, regionId])

  const tile = BASEMAPS[basemap]

  const viewData = useMemo(() => {
    if (districtId && districts) {
      return {
        type: 'FeatureCollection' as const,
        features: districts.features.filter((f) => String(f.properties.id) === districtId),
      }
    }
    if (regionId && districts) {
      return {
        type: 'FeatureCollection' as const,
        features: districts.features.filter((f) => f.properties.regionId === regionId),
      }
    }
    return regions
  }, [regions, districts, regionId, districtId])

  const fieldsData = useMemo(() => {
    if (!districtId || !districts) return null
    const parent = {
      type: 'FeatureCollection' as const,
      features: districts.features.filter((f) => String(f.properties.id) === districtId),
    }
    return buildFieldsForFeatures(
      parent,
      (f) => (f.properties as DistrictProps).ndvi,
      (f) => String((f.properties as DistrictProps).id),
      'ndvi',
      0.018,
      0.14,
    )
  }, [districts, districtId])

  const regionLabels = useMemo(() => {
    if (!regions || regionId) return []
    return regions.features.map((f) => {
      const name = shortRegionName(t(`region.${f.properties.id}`))
      const center = L.geoJSON(f as Feature).getBounds().getCenter()
      return { id: f.properties.id, name, lat: center.lat, lng: center.lng }
    })
  }, [regions, regionId, t])

  const hint = fieldId
    ? t('input.map.hintField')
    : districtId
      ? t('input.map.hintDistrict')
      : t('input.map.hint')

  const styleFeature = useCallback(
    (feature?: Feature): PathOptions => {
      if (!feature) return {}
      if (!regionId) {
        return {
          color: theme === 'dark' ? 'rgba(255,255,255,0.75)' : '#5a6f64',
          weight: 1.35,
          fillColor: theme === 'dark' ? '#1a2e24' : '#c5d4cb',
          fillOpacity: theme === 'dark' ? 0.35 : 0.22,
          opacity: 0.95,
        }
      }
      if (districtId) {
        return {
          color: '#0f7a35',
          weight: 2,
          fillColor: '#000',
          fillOpacity: 0.04,
          opacity: 0.95,
        }
      }
      const id = String((feature.properties as DistrictProps).id ?? '')
      const active = id === districtId
      return {
        color: active ? '#0f7a35' : theme === 'dark' ? 'rgba(255,255,255,0.55)' : '#2a8f4a',
        weight: active ? 2.2 : 1.1,
        fillColor: active ? '#2fbf5b' : theme === 'dark' ? '#1f4a32' : '#8fd9a4',
        fillOpacity: active ? 0.42 : theme === 'dark' ? 0.28 : 0.2,
        opacity: 0.95,
      }
    },
    [regionId, districtId, theme],
  )

  const styleField = useCallback(
    (feature?: Feature): PathOptions => {
      if (!feature) return {}
      const props = feature.properties as FieldProps
      const active = props.id === fieldId
      return {
        color: active ? '#ffffff' : theme === 'dark' ? 'rgba(255,255,255,0.35)' : '#1f7a3a',
        weight: active ? 2.4 : 0.8,
        fillColor: active ? '#2fbf5b' : theme === 'dark' ? '#1f4a32' : '#7bc96a',
        fillOpacity: active ? 0.55 : theme === 'dark' ? 0.32 : 0.28,
        opacity: 0.95,
      }
    },
    [fieldId, theme],
  )

  const onEachFeature = useCallback(
    (feature: Feature, layer: Layer) => {
      const path = layer as L.Path

      if (!regionId) {
        const props = feature.properties as RegionProps
        path.on({
          mouseover: (e: LeafletMouseEvent) => {
            const target = e.target as L.Path
            target.setStyle({ weight: 2.2, fillOpacity: theme === 'dark' ? 0.5 : 0.35 })
            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) target.bringToFront()
          },
          mouseout: () => {
            geoRef.current?.resetStyle(path)
          },
          click: (e: LeafletMouseEvent) => {
            L.DomEvent.stopPropagation(e)
            onSelectRegion(props.id)
          },
        })
        return
      }

      if (districtId) return

      const props = feature.properties as DistrictProps
      const name = props.name_en
      path.bindTooltip(name, {
        sticky: true,
        direction: 'top',
        opacity: 0.96,
        className: 'input-map-tooltip',
      })
      path.on({
        mouseover: (e: LeafletMouseEvent) => {
          const target = e.target as L.Path
          target.setStyle({
            weight: 2,
            fillOpacity: theme === 'dark' ? 0.42 : 0.34,
          })
          if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) target.bringToFront()
        },
        mouseout: () => {
          geoRef.current?.resetStyle(path)
        },
        click: (e: LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(e)
          if (props.regionId) onSelectDistrict(props.regionId, String(props.id))
        },
      })
    },
    [regionId, districtId, onSelectRegion, onSelectDistrict, theme],
  )

  const onEachField = useCallback(
    (feature: Feature, layer: Layer) => {
      const props = feature.properties as FieldProps
      const path = layer as L.Path
      const label = `${t('map.field')} ${fieldLabel(props.id)}`
      path.bindTooltip(label, {
        sticky: true,
        direction: 'top',
        opacity: 0.96,
        className: 'input-map-tooltip',
      })
      path.on({
        mouseover: (e: LeafletMouseEvent) => {
          if (drawing) return
          const target = e.target as L.Path
          if (props.id !== fieldRef.current) {
            target.setStyle({ weight: 1.6, fillOpacity: 0.45 })
          }
          if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) target.bringToFront()
        },
        mouseout: () => {
          fieldsRef.current?.resetStyle(path)
        },
        click: (e: LeafletMouseEvent) => {
          if (drawing) return
          L.DomEvent.stopPropagation(e)
          onSelectField(props.id)
        },
      })
    },
    [t, drawing, onSelectField],
  )

  const draftLatLngs = draft.map(([lng, lat]) => [lat, lng] as [number, number])
  const shapePolygons = shapes.map((ring) => ring.map(([lng, lat]) => [lat, lng] as [number, number]))

  return (
    <section className="input-map-card">
      <header className="input-map-card__head">
        <div className="input-map-card__title">
          <MapPinned size={16} />
          <div>
            <h2>{t('input.map.title')}</h2>
            <p>{hint}</p>
          </div>
        </div>
      </header>
      <div className="input-map-card__body">
        {loading || !ready ? (
          <div className="input-map-card__loading">{t('input.map.loading')}</div>
        ) : null}
        <InputMapControls
          map={map}
          basemap={basemap}
          onBasemapChange={setBasemap}
          drawEnabled={Boolean(fieldId)}
          drawing={drawing}
          onToggleDraw={() => setDrawing((v) => !v)}
          onUndo={() => setDraft((prev) => prev.slice(0, -1))}
          onClear={() => {
            setDraft([])
            setShapes([])
          }}
          onFinish={() => {
            if (draft.length < 3) return
            setShapes((prev) => [...prev, [...draft, draft[0]]])
            setDraft([])
            setDrawing(false)
          }}
          canUndo={draft.length > 0}
          canFinish={draft.length >= 3}
        />
        {drawing ? <div className="input-map-card__draw-hint">{t('input.draw.hint')}</div> : null}
        <MapContainer
          center={UZ_CENTER}
          zoom={6}
          minZoom={5}
          maxZoom={18}
          maxBounds={UZ_BOUNDS.pad(0.15)}
          maxBoundsViscosity={0.85}
          zoomControl={false}
          attributionControl={false}
          className="input-map-card__leaflet"
          whenReady={() => setReady(true)}
        >
          <TileLayer key={basemap} url={tile.url} maxZoom={tile.maxZoom} />
          <MapReady onReady={setMap} />
          <InvalidateSize />
          <FitBounds
            regions={regions}
            districts={districts}
            fields={fieldsData}
            regionId={regionId}
            districtId={districtId}
            fieldId={fieldId}
          />
          <DrawCapture
            active={drawing}
            onPoint={(coord) => setDraft((prev) => [...prev, coord])}
          />
          {viewData ? (
            <GeoJSON
              key={`view-${regionId || 'all'}-${districtId || 'none'}-${theme}`}
              data={viewData}
              style={styleFeature}
              onEachFeature={onEachFeature as never}
              ref={(instance) => {
                geoRef.current = instance
              }}
            />
          ) : null}
          {fieldsData ? (
            <GeoJSON
              key={`fields-${districtId}-${fieldId || 'none'}-${theme}`}
              data={fieldsData}
              style={styleField}
              onEachFeature={onEachField as never}
              ref={(instance) => {
                fieldsRef.current = instance
              }}
            />
          ) : null}
          {shapePolygons.map((positions, i) => (
            <Polygon
              key={`shape-${i}`}
              positions={positions}
              pathOptions={{
                color: '#f5a524',
                weight: 2.2,
                fillColor: '#f5a524',
                fillOpacity: 0.28,
              }}
            />
          ))}
          {draftLatLngs.length >= 2 ? (
            <Polyline
              positions={draftLatLngs}
              pathOptions={{ color: '#f5a524', weight: 2, dashArray: '6 4' }}
            />
          ) : null}
          {draftLatLngs.map((pos, i) => (
            <Marker
              key={`pt-${i}`}
              position={pos}
              interactive={false}
              icon={L.divIcon({
                className: 'input-map-draw-pt',
                html: '<span></span>',
                iconSize: [10, 10],
                iconAnchor: [5, 5],
              })}
            />
          ))}
          {regionLabels.map((label) => (
            <Marker
              key={label.id}
              position={[label.lat, label.lng]}
              interactive={false}
              icon={L.divIcon({
                className: 'input-map-label',
                html: `<span>${label.name}</span>`,
                iconSize: [0, 0],
                iconAnchor: [0, 0],
              })}
            />
          ))}
        </MapContainer>
      </div>
    </section>
  )
}
