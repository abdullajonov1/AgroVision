import bbox from '@turf/bbox'
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import { point, polygon } from '@turf/helpers'
import type { Feature, FeatureCollection, Geometry, Polygon, Position } from 'geojson'
import { featureIndexValue } from '../data'

export type FieldProps = {
  id: string
  parentId: string
  ndvi: number
  kind: 'field'
}

function hashSeed(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function rotate(lon: number, lat: number, cx: number, cy: number, deg: number): Position {
  const rad = (deg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const dx = lon - cx
  const dy = lat - cy
  return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos]
}

function allCornersInside(ring: Position[], parent: Feature<Geometry>): boolean {
  return ring.every((coord) => booleanPointInPolygon(point(coord), parent as never))
}

/**
 * Approximate agricultural field patches inside an admin polygon.
 * Stable for a given parentId + densityKey (seeded RNG).
 */
export function generateFieldPatches(
  parent: Feature<Geometry>,
  opts: {
    parentId: string
    baseNdvi: number
    index: string
    /** Approximate cell size in degrees (lon). Smaller = denser. */
    cellSize: number
    /** Chance to skip a cell (gaps between fields). */
    skipChance?: number
  },
): FeatureCollection<Polygon, FieldProps> {
  const { parentId, baseNdvi, index, cellSize } = opts
  const skipChance = opts.skipChance ?? 0.22
  const [minX, minY, maxX, maxY] = bbox(parent)
  const width = Math.max(maxX - minX, 0.02)
  const height = Math.max(maxY - minY, 0.02)

  const cols = Math.max(2, Math.round(width / cellSize))
  const rows = Math.max(2, Math.round(height / cellSize))
  const stepX = width / cols
  const stepY = height / rows
  const rnd = mulberry32(hashSeed(`${parentId}:${index}:${cols}x${rows}`))

  const features: Feature<Polygon, FieldProps>[] = []
  let n = 0

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (rnd() < skipChance) continue

      const jitterX = (rnd() - 0.5) * stepX * 0.35
      const jitterY = (rnd() - 0.5) * stepY * 0.35
      const cx = minX + (col + 0.5) * stepX + jitterX
      const cy = minY + (row + 0.5) * stepY + jitterY

      if (!booleanPointInPolygon(point([cx, cy]), parent as never)) continue

      // Irregular field footprint
      const w = stepX * (0.55 + rnd() * 0.38)
      const h = stepY * (0.52 + rnd() * 0.4)
      const halfW = w / 2
      const halfH = h / 2
      const inset = 0.08 + rnd() * 0.12

      const corners: Position[] = [
        [cx - halfW * (1 - inset * rnd()), cy - halfH * (1 - inset * rnd())],
        [cx + halfW * (1 - inset * rnd()), cy - halfH * (1 - inset * rnd())],
        [cx + halfW * (1 - inset * rnd()), cy + halfH * (1 - inset * rnd())],
        [cx - halfW * (1 - inset * rnd()), cy + halfH * (1 - inset * rnd())],
      ]

      const angle = (rnd() - 0.5) * 28
      const ring = corners.map((c) => rotate(c[0], c[1], cx, cy, angle))
      ring.push(ring[0])

      if (!allCornersInside(ring.slice(0, 4), parent)) continue

      const fieldId = `${parentId}-f${n}`
      const ndvi = featureIndexValue(baseNdvi, fieldId, index)
      features.push(
        polygon([ring], {
          id: fieldId,
          parentId,
          ndvi,
          kind: 'field',
        }),
      )
      n++
    }
  }

  return { type: 'FeatureCollection', features }
}

export function buildFieldsForFeatures(
  parents: FeatureCollection<Geometry> | null,
  getBaseNdvi: (f: Feature<Geometry>) => number,
  getParentId: (f: Feature<Geometry>) => string,
  index: string,
  cellSize: number,
  skipChance = 0.2,
): FeatureCollection<Polygon, FieldProps> | null {
  if (!parents) return null
  const features: Feature<Polygon, FieldProps>[] = []
  for (const f of parents.features) {
    const parentId = getParentId(f)
    const base = getBaseNdvi(f)
    const patch = generateFieldPatches(f, {
      parentId,
      baseNdvi: base,
      index,
      cellSize,
      skipChance,
    })
    features.push(...patch.features)
  }
  return { type: 'FeatureCollection', features }
}
