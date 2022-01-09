import type { Pt } from './types'

const len2 = (p0: Pt, p1: Pt): number => {
  const a = p0.x - p1.x
  const b = p0.y - p1.y

  return a * a + b * b
}

const cross = (p: Pt, a: Pt, b: Pt) => {
  return (p.x - a.x) * (b.y - a.y) - (b.x - a.x) * (p.y - a.y)
}

export const isPointOnLine = (p: Pt, a: Pt, b: Pt): boolean => {
  return cross(p, a, b) === 0
}

export const isPointInsideSegment = (p: Pt, a: Pt, b: Pt): boolean => {
  return cross(p, a, b) < 0
}

export const projToSegment = (p: Pt, a: Pt, b: Pt): Pt => {
  // Subtract (b - a) and (p - a), to base 2 vectors on (a) point
  // Calc dot-product
  // Divide result by (b - a) length to get projected (p - a) length
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / len2(a, b)

  // Clamp to segment bounds
  t = Math.max(0, Math.min(1, t))

  // Contruct projected point
  return {
    x: a.x + t * (b.x - a.x),
    y: a.y + t * (b.y - a.y),
  }
}

export const projToLine = (p: Pt, a: Pt, b: Pt): Pt => {
  const t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / len2(a, b)

  return {
    x: a.x + t * (b.x - a.x),
    y: a.y + t * (b.y - a.y),
  }
}

export const distToSegment2 = (p: Pt, a: Pt, b: Pt) => {
  return len2(p, projToSegment(p, a, b))
}

export const distToLine2 = (p: Pt, a: Pt, b: Pt) => {
  return len2(p, projToLine(p, a, b))
}

export const isLineOnLine = (a0: Pt, a1: Pt, b0: Pt, b1: Pt): boolean => {
  return isPointOnLine(a0, b0, b1) && isPointOnLine(a1, b0, b1)
}

const isIntersecting = (a0: Pt, a1: Pt, b0: Pt, b1: Pt): boolean => {
  const v0x = a1.x - a0.x
  const v0y = a1.y - a0.y
  const v1x = b1.x - b0.x
  const v1y = b1.y - b0.y
  const cross = v0x * v1y - v1x * v0y

  if (cross === 0) {
    return false
  } // collinear

  const s02_x = a0.x - b0.x
  const s02_y = a0.y - b0.y
  const s_numer = v0x * s02_y - v0y * s02_x

  if (s_numer < 0 === cross > 0) {
    return false
  } // no collision

  const t_numer = v1x * s02_y - v1y * s02_x

  if (t_numer < 0 === cross > 0) {
    return false
  } // no collision

  if (s_numer > cross === cross > 0 || t_numer > cross === cross > 0) {
    return false
  } // no collision

  return true
}

export const getSegmentIntersectionPoint = (a0: Pt, a1: Pt, b0: Pt, b1: Pt): Pt | null => {
  const v0x = a1.x - a0.x
  const v0y = a1.y - a0.y
  const v1x = b1.x - b0.x
  const v1y = b1.y - b0.y
  const cross = v0x * v1y - v1x * v0y

  if (cross === 0) {
    return null
  } // collinear

  const s02_x = a0.x - b0.x
  const s02_y = a0.y - b0.y
  const s_numer = v0x * s02_y - v0y * s02_x

  if (s_numer < 0 === cross > 0) {
    return null
  } // no collision

  const t_numer = v1x * s02_y - v1y * s02_x

  if (t_numer < 0 === cross > 0) {
    return null
  } // no collision

  if (s_numer > cross === cross > 0 || t_numer > cross === cross > 0) {
    return null
  } // no collision

  // collision detected
  const t = t_numer / cross

  return {
    x: a0.x + (t * v0x),
    y: a0.y + (t * v0y),
  }
}

const getClosestSegmentIndex = (p: Pt, points: readonly Pt[]) => {
  let index = 0
  let min = distToSegment2(p, points[0], points[1])

  for (let i = 1; i < points.length; i++) {
    const d = distToSegment2(p, points[i], points[(i + 1) % points.length])

    if (d < min) {
      index = i
      min = d
    }
  }

  return index
}

export const isPointInsideLoop = (p: Pt, points: readonly Pt[]) => {
  const i = getClosestSegmentIndex(p, points)

  return isPointInsideSegment(p, points[i], points[(i + 1) % points.length])
}

const isSegmentIntersectLoop = (p0: Pt, p1: Pt, points: readonly Pt[]): boolean => {
  for (let i = 0; i < points.length; i++) {
    if (isIntersecting(p0, p1, points[i], points[(i + 1) % points.length])) {
      return true
    }
  }

  return false
}

export const isPointNearPoints = (pt: Pt, points: Pt[]): boolean => {
  for (let i = 0; i < points.length; i++) {
    if (len2(pt, points[i]) < 64) {
      return true
    }
  }

  return false
}

const discardEdge = (indices: number[], edgeIndex: number) => {
  for (let i = edgeIndex + 2; i < indices.length; i += 2) {
    indices[i - 2] = indices[i]
    indices[i - 1] = indices[i + 1]
  }

  indices.length = indices.length - 2
}
const discardEdges = (indices: number[], edgeIndexes: number[]) => {
  for (let i = 0;i < edgeIndexes.length; i++) {
    indices[edgeIndexes[i]] = -1
  }

  for (let i = 0, len = indices.length; i < len; i += 2) {
    if (indices[i] === -1) {
      discardEdge(indices, i)
      i -= 2
      len -= 2
    }
  }
}
const getNumDiscardedIndexesLessThan = (edgeIndex: number, discardedIndexes: readonly number[]): number => {
  let res = 0

  for (let i = 0; i < discardedIndexes.length; i++) {
    if (discardedIndexes[i] <= edgeIndex) {
      ++res
    }
  }

  return res
}

export const triangulate = (points: readonly Pt[]): number[] => {
  const indices: number[] = []

  const discardLongerEdges = (edgeIndex: number, /* out */discardedEdgeIndexes: number[]) => {
    discardedEdgeIndexes.length = 0

    const pi0 = indices[edgeIndex]
    const pi1 = indices[edgeIndex + 1]
    const len = len2(points[pi0], points[pi1])

    for (let i = 0; i < indices.length; i += 2) {
      if (i === edgeIndex) {
        continue
      }

      const i0 = indices[i]
      const i1 = indices[i + 1]

      if (
        pi0 !== i0 &&
        pi0 !== i1 &&
        pi1 !== i0 &&
        pi1 !== i1 &&
        isIntersecting(points[pi0], points[pi1], points[i0], points[i1])
      ) {
        if (len2(points[i0], points[i1]) < len) {
          // Is not shorter
          discardedEdgeIndexes.length = 0
          discardedEdgeIndexes.push(edgeIndex)

          return
        }

        // Is shorter
        discardedEdgeIndexes.push(i)
      }
    }
  }

  const isSameEdgeButReversed = (i0: number, i1: number) => {
    for (let e = 0; e < indices.length; e += 2) {
      // Same edge exists, but reversed
      if (indices[e + 1] === i0 && indices[e] === i1) {
        return true
      }
    }

    return false
  }

  const isMiddleOutsideLoop = (edgeIndex: number) => {
    const ei0 = indices[edgeIndex]
    const ei1 = indices[edgeIndex + 1]
    const p0 = points[ei0]
    const p1 = points[ei1]

    if (!isPointInsideLoop(
      {
        x: (p0.x + p1.x) / 2,
        y: (p0.y + p1.y) / 2,
      },
      points
    )) {
      console.log('OUTSIDE', `${ei0}->${ei1}`)

      return true
    }

    return false
  }

  const doesIntersectLoop = (edgeIndex: number) => {
    const ei0 = indices[edgeIndex]
    const ei1 = indices[edgeIndex + 1]
    const p0 = points[ei0]
    const p1 = points[ei1]

    for (let pi = 0; pi < points.length; pi++) {
      const npi = (pi + 1) % points.length

      if (pi !== ei0 && pi !== ei1 && npi !== ei0 && npi !== ei1 && isIntersecting(p0, p1, points[pi], points[npi])) {
        console.log('INTER', `${ei0}->${ei1}`, `${pi}->${npi}`)

        return true
      }
    }

    if (isMiddleOutsideLoop(edgeIndex)) {
      return true
    }

    return false
  }

  // Generate edges
  for (let i = 0; i < points.length; i++) {
    console.log('------------------ I:', i)

    for (let k = (i + 2) % points.length; k !== (i - 1 + points.length) % points.length; k = ((k + 1) % points.length)) {
      console.log(i, '->', k)

      // Same edge exists, but reversed
      if (isSameEdgeButReversed(i, k)) {
        console.log('SAME REVERSED')
        continue
      }

      indices.push(i, k)
    }
  }

  const tempNumbers: number[] = []

  for (let i = 0, len = indices.length; i < len; i += 2) {
    if (doesIntersectLoop(i)) {
      discardEdge(indices, i)
      i -= 2
      len -= 2

      continue
    }

    //New edge intersects others
    discardLongerEdges(i, tempNumbers)

    if (tempNumbers.length > 0) {
      console.log('LONGER EDGES', `${indices[i]} -> ${indices[i + 1]}`, tempNumbers.map((i) => `${indices[i]} -> ${indices[i + 1]}`))
      discardEdges(indices, tempNumbers)
      i -= 2 * getNumDiscardedIndexesLessThan(i, tempNumbers)
      len -= 2 * tempNumbers.length

      continue
    }
  }

  return indices
}

export const getLoopAABB = (points: readonly Pt[]): Pt[] => {
  let minX = points[0].x
  let minY = points[0].y
  let maxX = minX
  let maxY = minY

  for (let i = 1; i < points.length; i++) {
    const pt = points[i]

    minX = Math.min(minX, pt.x)
    maxX = Math.max(maxX, pt.x)
    minY = Math.min(minY, pt.y)
    maxY = Math.max(maxY, pt.y)
  }

  return [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY },
  ]
}

export const getPointOutsideBB = (aabb: readonly Pt[]): Pt => {
  return { x: aabb[2].x + 10, y: aabb[2].y + 10 }
}

export const validateLoopOrder = (points: Pt[]) => {
  const aabb = getLoopAABB(points)
  const pt = getPointOutsideBB(aabb)

  if (isPointInsideLoop(pt, points)) {
    points.reverse()
  }
}
