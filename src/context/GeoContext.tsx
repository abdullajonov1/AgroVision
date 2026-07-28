import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { FeatureCollection, Feature, Geometry } from 'geojson'

export type RegionProps = {
  id: string
  name_en: string
  name_ru: string
  name_uz: string
}

export type DistrictProps = {
  id: string
  name_en: string
  regionId: string | null
  fields: number
  ndvi: number
}

type GeoContextValue = {
  regions: FeatureCollection<Geometry, RegionProps> | null
  districts: FeatureCollection<Geometry, DistrictProps> | null
  loading: boolean
  selectedRegionId: string | null
  selectedDistrictId: string | null
  selectedFieldId: string | null
  setSelectedRegionId: (id: string | null) => void
  setSelectedDistrictId: (id: string | null) => void
  setSelectedFieldId: (id: string | null) => void
  clearSelection: () => void
  getRegionName: (feature: Feature<Geometry, RegionProps>, locale: string) => string
}

const GeoContext = createContext<GeoContextValue | null>(null)

export function GeoProvider({ children }: { children: ReactNode }) {
  const [regions, setRegions] = useState<FeatureCollection<Geometry, RegionProps> | null>(null)
  const [districts, setDistricts] = useState<FeatureCollection<Geometry, DistrictProps> | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedRegionId, setSelectedRegionIdState] = useState<string | null>(null)
  const [selectedDistrictId, setSelectedDistrictIdState] = useState<string | null>(null)
  const [selectedFieldId, setSelectedFieldIdState] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [r, d] = await Promise.all([
          fetch('/geojson/uzbekistan_regions.geojson').then((res) => res.json()),
          fetch('/geojson/uzbekistan_districts.geojson').then((res) => res.json()),
        ])
        if (!cancelled) {
          setRegions(r)
          setDistricts(d)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const setSelectedRegionId = useCallback((id: string | null) => {
    setSelectedRegionIdState(id)
    setSelectedDistrictIdState(null)
    setSelectedFieldIdState(null)
  }, [])

  const setSelectedDistrictId = useCallback((id: string | null) => {
    setSelectedDistrictIdState(id)
    setSelectedFieldIdState(null)
  }, [])

  const setSelectedFieldId = useCallback((id: string | null) => {
    setSelectedFieldIdState(id)
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedRegionIdState(null)
    setSelectedDistrictIdState(null)
    setSelectedFieldIdState(null)
  }, [])

  const getRegionName = useCallback(
    (feature: Feature<Geometry, RegionProps>, locale: string) => {
      if (locale === 'ru') return feature.properties.name_ru
      return feature.properties.name_uz || feature.properties.name_en
    },
    [],
  )

  const value = useMemo(
    () => ({
      regions,
      districts,
      loading,
      selectedRegionId,
      selectedDistrictId,
      selectedFieldId,
      setSelectedRegionId,
      setSelectedDistrictId,
      setSelectedFieldId,
      clearSelection,
      getRegionName,
    }),
    [
      regions,
      districts,
      loading,
      selectedRegionId,
      selectedDistrictId,
      selectedFieldId,
      setSelectedRegionId,
      setSelectedDistrictId,
      setSelectedFieldId,
      clearSelection,
      getRegionName,
    ],
  )

  return <GeoContext.Provider value={value}>{children}</GeoContext.Provider>
}

export function useGeo() {
  const ctx = useContext(GeoContext)
  if (!ctx) throw new Error('useGeo must be used within GeoProvider')
  return ctx
}
