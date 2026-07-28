import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type VegIndex = 'NDVI' | 'EVI' | 'SAVI' | 'NDWI'

type IndexContextValue = {
  index: VegIndex
  setIndex: (index: VegIndex) => void
}

const IndexContext = createContext<IndexContextValue | null>(null)

export function IndexProvider({ children }: { children: ReactNode }) {
  const [index, setIndexState] = useState<VegIndex>('NDVI')
  const setIndex = useCallback((next: VegIndex) => setIndexState(next), [])
  const value = useMemo(() => ({ index, setIndex }), [index, setIndex])
  return <IndexContext.Provider value={value}>{children}</IndexContext.Provider>
}

export function useVegIndex() {
  const ctx = useContext(IndexContext)
  if (!ctx) throw new Error('useVegIndex must be used within IndexProvider')
  return ctx
}
