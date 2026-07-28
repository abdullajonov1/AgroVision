import { useEffect, useMemo, useRef, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  useMap,
} from 'react-leaflet'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import type { Layer, PathOptions, LeafletMouseEvent } from 'leaflet'
import L from 'leaflet'
import {
  Filter,
  Plus,
  Minus,
  Layers,
  Maximize2,
  Map as MapIcon,
  Moon,
  Navigation,
  Satellite,
  Mountain,
  CalendarDays,
  ChevronDown,
} from 'lucide-react'
import { useI18n } from '../i18n/I18nContext'
import { useTheme } from '../theme/ThemeContext'
import { useGeo, type DistrictProps } from '../context/GeoContext'
import { useVegIndex } from '../context/IndexContext'
import {
  ndviByRegionId,
  ndviColor,
  featureIndexValue,
} from '../data'
import { buildFieldsForFeatures, type FieldProps } from '../utils/fieldPolygons'
import { DateCalendar, formatDisplayDate } from './DateCalendar'
import 'leaflet/dist/leaflet.css'
import './MapPanel.css'

const UZ_CENTER: [number, number] = [41.3, 64.5]
const UZ_BOUNDS = L.latLngBounds([37.1, 55.9], [45.7, 73.2])

export type BasemapId = 'light' | 'dark' | 'streets' | 'satellite' | 'terrain'

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

function MapReady({ onReady }: { onReady: (map: L.Map) => void }) {
  const map = useMap()
  useEffect(() => {
    onReady(map)
  }, [map, onReady])
  return null
}

function MapControls({
  map,
  basemap,
  onBasemapChange,
}: {
  map: L.Map | null
  basemap: BasemapId
  onBasemapChange: (id: BasemapId) => void
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
    <div className="map-panel__controls" ref={wrapRef}>
      <button type="button" aria-label="+" onClick={() => map?.zoomIn()}>
        <Plus size={16} />
      </button>
      <button type="button" aria-label="-" onClick={() => map?.zoomOut()}>
        <Minus size={16} />
      </button>
      <div className="map-panel__layers-wrap">
        <button
          type="button"
          aria-label={t('map.basemap')}
          className={open ? 'is-active' : ''}
          onClick={() => setOpen((v) => !v)}
        >
          <Layers size={16} />
        </button>
        {open && (
          <div className="map-panel__basemap" role="menu">
            <div className="map-panel__basemap-title">{t('map.basemap')}</div>
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
        )}
      </div>
      <button
        type="button"
        aria-label="fullscreen"
        onClick={() => {
          const el = document.querySelector('.map-panel__canvas')
          if (!el) return
          if (document.fullscreenElement) document.exitFullscreen()
          else el.requestFullscreen?.()
        }}
      >
        <Maximize2 size={16} />
      </button>
    </div>
  )
}

function FitToData({
  data,
  maxZoom = 9,
  enabled = true,
}: {
  data: FeatureCollection<Geometry> | null
  maxZoom?: number
  enabled?: boolean
}) {
  const map = useMap()
  useEffect(() => {
    if (!enabled) return
    if (!data || !data.features.length) {
      map.fitBounds(UZ_BOUNDS, { padding: [24, 24] })
      return
    }
    const layer = L.geoJSON(data as GeoJSON.GeoJsonObject)
    const bounds = layer.getBounds()
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [36, 36], maxZoom })
    }
  }, [data, map, maxZoom, enabled])
  return null
}

function FitToField({
  fields,
  fieldId,
}: {
  fields: FeatureCollection<Geometry, FieldProps> | null
  fieldId: string | null
}) {
  const map = useMap()
  useEffect(() => {
    if (!fieldId || !fields) return
    const f = fields.features.find((x) => x.properties.id === fieldId)
    if (!f) return
    const layer = L.geoJSON(f as GeoJSON.GeoJsonObject)
    const bounds = layer.getBounds()
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.55), { padding: [48, 48], maxZoom: 16, animate: true })
    }
  }, [fields, fieldId, map])
  return null
}

function InvalidateSize() {
  const map = useMap()
  useEffect(() => {
    const onResize = () => map.invalidateSize()
    window.addEventListener('resize', onResize)
    const t = window.setTimeout(onResize, 100)
    const t2 = window.setTimeout(onResize, 400)
    return () => {
      window.removeEventListener('resize', onResize)
      window.clearTimeout(t)
      window.clearTimeout(t2)
    }
  }, [map])
  return null
}

export function MapPanel() {
  const { t, locale } = useI18n()
  const { theme } = useTheme()
  const { index } = useVegIndex()
  const {
    regions,
    districts,
    loading,
    selectedRegionId,
    selectedDistrictId,
    selectedFieldId,
    setSelectedRegionId,
    setSelectedDistrictId,
    setSelectedFieldId,
  } = useGeo()
  const [mode, setMode] = useState<'map' | 'drone'>('map')
  const [basemap, setBasemap] = useState<BasemapId>('satellite')
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null)
  const [mapDate, setMapDate] = useState(() => new Date(2025, 5, 9))
  const [calOpen, setCalOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const geoJsonRef = useRef<L.GeoJSON | null>(null)
  const fieldsRef = useRef<L.GeoJSON | null>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const onMapReady = useMemo(() => (map: L.Map) => setMapInstance(map), [])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!toolbarRef.current?.contains(e.target as Node)) {
        setCalOpen(false)
        setFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => {
    if (theme === 'dark' && basemap === 'light') setBasemap('dark')
    if (theme === 'light' && basemap === 'dark') setBasemap('satellite')
  }, [theme, basemap])

  // Country: regions only (no district borders). Region selected: districts.
  const viewData = useMemo(() => {
    if (selectedDistrictId && districts) {
      return {
        type: 'FeatureCollection' as const,
        features: districts.features.filter(
          (f) => String(f.properties.id) === selectedDistrictId,
        ),
      }
    }

    if (selectedRegionId && districts) {
      return {
        type: 'FeatureCollection' as const,
        features: districts.features.filter(
          (f) => f.properties.regionId === selectedRegionId,
        ),
      }
    }

    return regions
  }, [regions, districts, selectedRegionId, selectedDistrictId])

  // Approximate field patches — each gets its own NDVI color
  const fieldsData = useMemo(() => {
    if (!viewData) return null
    const cellSize = selectedDistrictId ? 0.018 : selectedRegionId ? 0.055 : 0.16
    const skipChance = selectedDistrictId ? 0.12 : selectedRegionId ? 0.16 : 0.18
    if (!selectedRegionId) {
      return buildFieldsForFeatures(
        viewData,
        (f) => ndviByRegionId[(f.properties as { id: string }).id] ?? 0.5,
        (f) => (f.properties as { id: string }).id,
        index,
        cellSize,
        skipChance,
      )
    }
    return buildFieldsForFeatures(
      viewData,
      (f) => (f.properties as DistrictProps).ndvi,
      (f) => String((f.properties as DistrictProps).id),
      index,
      cellSize,
      skipChance,
    )
  }, [viewData, selectedRegionId, selectedDistrictId, index])

  const fitMaxZoom = selectedDistrictId ? 12 : selectedRegionId ? 9 : 7

  const tile = BASEMAPS[basemap]

  /** Admin borders only — fill comes from field patches */
  const styleBoundary = (): PathOptions => ({
    fillColor: '#000',
    fillOpacity: 0.04,
    weight: selectedDistrictId ? 2 : selectedRegionId ? 1 : 1.35,
    color: 'rgba(255,255,255,0.85)',
    opacity: 0.95,
  })

  const styleField = (feature?: Feature): PathOptions => {
    if (!feature) return {}
    const props = feature.properties as FieldProps
    const active = selectedFieldId === props.id
    return {
      fillColor: ndviColor(props.ndvi),
      fillOpacity: active ? 0.95 : selectedDistrictId ? 0.82 : 0.78,
      weight: active ? 2.4 : 0.35,
      color: active ? '#fff' : 'rgba(255,255,255,0.28)',
      opacity: 0.95,
    }
  }

  const onEachBoundary = (feature: Feature, layer: Layer) => {
    const path = layer as L.Path

    if (!selectedRegionId) {
      const props = feature.properties as {
        id: string
        name_en?: string
        name_ru?: string
        name_uz?: string
      }
      const base = ndviByRegionId[props.id] ?? 0.5
      const value = featureIndexValue(base, props.id, index)
      const name =
        locale === 'ru'
          ? props.name_ru
          : props.name_uz || props.name_en || props.id

      path.on({
        mouseover: (e: LeafletMouseEvent) => {
          const target = e.target as L.Path
          target.setStyle({ weight: 2.4, fillOpacity: 0.1 })
          if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            target.bringToFront()
          }
        },
        mouseout: () => {
          geoJsonRef.current?.resetStyle(path)
        },
        click: () => {
          if (props.id) setSelectedRegionId(props.id)
        },
      })

      path.bindTooltip(
        `<strong>${name}</strong><br/>${index} ${value.toFixed(2)}`,
        { sticky: true, opacity: 0.95 },
      )
      return
    }

    const props = feature.properties as DistrictProps
    const value = featureIndexValue(props.ndvi, String(props.id), index)

    path.on({
      mouseover: (e: LeafletMouseEvent) => {
        const target = e.target as L.Path
        target.setStyle({ weight: 2.2, fillOpacity: 0.1 })
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
          target.bringToFront()
        }
      },
      mouseout: () => {
        geoJsonRef.current?.resetStyle(path)
      },
      click: () => {
        setSelectedDistrictId(String(props.id))
      },
    })

    path.bindTooltip(
      `<strong>${props.name_en}</strong><br/>${index} ${value.toFixed(2)}`,
      { sticky: true, opacity: 0.95 },
    )
  }

  const onEachField = (feature: Feature, layer: Layer) => {
    const props = feature.properties as FieldProps
    const path = layer as L.Path

    path.on({
      mouseover: (e: LeafletMouseEvent) => {
        const target = e.target as L.Path
        const active = selectedFieldId === props.id
        if (!active) {
          target.setStyle({ weight: 1.2, fillOpacity: 0.92, color: 'rgba(255,255,255,0.7)' })
        }
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
          target.bringToFront()
        }
      },
      mouseout: () => {
        fieldsRef.current?.resetStyle(path)
      },
      click: (e: LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e)
        if (!selectedRegionId) {
          setSelectedRegionId(props.parentId)
          return
        }
        if (!selectedDistrictId) {
          setSelectedDistrictId(props.parentId)
          return
        }
        setSelectedFieldId(props.id)
      },
    })

    path.bindTooltip(
      selectedDistrictId
        ? `<strong>${t('map.field')} ${props.id.split('-').pop()}</strong><br/>${index} ${props.ndvi.toFixed(2)}`
        : `${index} ${props.ndvi.toFixed(2)}`,
      {
        sticky: true,
        opacity: 0.92,
      },
    )
  }

  const regionLabels = useMemo(() => {
    if (!regions || selectedDistrictId) return []
    const features = selectedRegionId
      ? regions.features.filter((f) => f.properties.id === selectedRegionId)
      : regions.features
    return features.map((f) => {
      const name =
        locale === 'ru' ? f.properties.name_ru : f.properties.name_uz || f.properties.name_en
      const short = name
        .replace(/область|вилояти|viloyati|провинция|Республика|область/gi, '')
        .replace(/\s+/g, ' ')
        .trim()
      const layer = L.geoJSON(f as GeoJSON.GeoJsonObject)
      const center = layer.getBounds().getCenter()
      return { id: f.properties.id, name: short, lat: center.lat, lng: center.lng }
    })
  }, [regions, locale, selectedDistrictId, selectedRegionId])

  const legendTitle = t('map.legend').replace('{index}', index)

  return (
    <section className="map-panel">
      <div className="map-panel__canvas">
        {loading || !viewData ? (
          <div className="map-panel__loading">{t('map.loading')}</div>
        ) : (
          <MapContainer
            center={UZ_CENTER}
            zoom={6}
            minZoom={5}
            maxZoom={18}
            maxBounds={UZ_BOUNDS.pad(0.15)}
            scrollWheelZoom
            zoomControl={false}
            attributionControl={false}
            className="map-panel__leaflet"
          >
            <TileLayer key={basemap} url={tile.url} maxZoom={tile.maxZoom ?? 19} />
            <GeoJSON
              key={`bounds-${selectedRegionId ?? 'all'}-${selectedDistrictId ?? 'none'}-${theme}-${locale}`}
              data={viewData as GeoJSON.GeoJsonObject}
              style={styleBoundary}
              onEachFeature={onEachBoundary}
              ref={(ref) => {
                geoJsonRef.current = ref
              }}
            />
            {fieldsData && (
              <GeoJSON
                key={`fields-${selectedRegionId ?? 'all'}-${selectedDistrictId ?? 'none'}-${index}-${selectedFieldId ?? 'none'}`}
                data={fieldsData as GeoJSON.GeoJsonObject}
                style={styleField}
                onEachFeature={onEachField}
                ref={(ref) => {
                  fieldsRef.current = ref
                }}
              />
            )}
            {!selectedDistrictId &&
              regionLabels.map((label) => (
                <Marker
                  key={label.id}
                  position={[label.lat, label.lng]}
                  interactive={false}
                  icon={L.divIcon({
                    className: 'map-city-label',
                    html: `<span>${label.name}</span>`,
                    iconSize: [1, 1],
                    iconAnchor: [0, 0],
                  })}
                />
              ))}
            <FitToData data={viewData} maxZoom={fitMaxZoom} enabled={!selectedFieldId} />
            <FitToField fields={fieldsData} fieldId={selectedFieldId} />
            <MapReady onReady={onMapReady} />
            <InvalidateSize />
          </MapContainer>
        )}

        <div className="map-panel__overlay" ref={toolbarRef}>
          <div className="map-panel__overlay-left">
            <div className="map-panel__tabs">
              <button
                type="button"
                className={mode === 'map' ? 'is-active' : ''}
                onClick={() => setMode('map')}
              >
                {t('map.mode.map')}
              </button>
              <button
                type="button"
                className={mode === 'drone' ? 'is-active' : ''}
                onClick={() => setMode('drone')}
              >
                {t('map.mode.drone')}
              </button>
            </div>
          </div>

          <div className="map-panel__overlay-right">
            <div className="map-panel__dropdown">
              <button
                type="button"
                className="map-panel__chip"
                onClick={() => {
                  setCalOpen((v) => !v)
                  setFilterOpen(false)
                }}
              >
                <CalendarDays size={14} />
                {formatDisplayDate(mapDate)}
                <ChevronDown size={14} />
              </button>
              {calOpen && (
                <DateCalendar
                  value={mapDate}
                  onChange={setMapDate}
                  onClose={() => setCalOpen(false)}
                  align="right"
                />
              )}
            </div>

            <div className="map-panel__dropdown">
              <button
                type="button"
                className="map-panel__chip"
                onClick={() => {
                  setFilterOpen((v) => !v)
                  setCalOpen(false)
                }}
              >
                <Filter size={14} />
                {t('map.filters')}
              </button>
              {filterOpen && (
                <ul className="map-panel__menu map-panel__menu--filters">
                  <li>
                    <button type="button" className="is-active">
                      {index} &gt; 0.5
                    </button>
                  </li>
                  <li>
                    <button type="button">Risk zones</button>
                  </li>
                  <li>
                    <button type="button">Active fields</button>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>

        <MapControls
          map={mapInstance}
          basemap={basemap}
          onBasemapChange={setBasemap}
        />

        <div className="map-panel__legend">
          <div className="map-panel__legend-title">{legendTitle}</div>
          <div className="map-panel__legend-bar" />
          <div className="map-panel__legend-scale">
            <span>0</span>
            <span>0.25</span>
            <span>0.50</span>
            <span>0.75</span>
            <span>1.00</span>
          </div>
        </div>
      </div>
    </section>
  )
}
