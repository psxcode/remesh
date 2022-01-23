/* eslint-disable max-params */
const len2 = (x0: number, y0: number, x1: number, y1: number): number => {
  return (x0 - x1) ** 2 + (y0 - y1) ** 2
}

const cross = (x: number, y: number, ax: number, ay: number, bx: number, by: number) => {
  return (x - ax) * (by - ay) - (bx - ax) * (y - ay)
}

const isPointOnLine = (x: number, y: number, ax: number, ay: number, bx: number, by: number): boolean => {
  return cross(x, y, ax, ay, bx, by) === 0
}

const isPointInsideSegment = (x: number, y: number, ax: number, ay: number, bx: number, by: number): boolean => {
  return cross(x, y, ax, ay, bx, by) < 0
}

const projToSegment = (x: number, y: number, ax: number, ay: number, bx: number, by: number): [number, number] => {
  // Subtract (b - a) and (p - a), to base 2 vectors on (a) point
  // Calc dot-product
  // Divide result by (b - a) length to get projected (p - a) length
  let t = ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / len2(ax, ay, bx, by)

  // Clamp to segment bounds
  t = Math.max(0, Math.min(1, t))

  // Contruct projected point
  return [
    ax + t * (bx - ax),
    ay + t * (by - ay),
  ]
}

export const projToLine = (x: number, y: number, ax: number, ay: number, bx: number, by: number): [number, number] => {
  const t = ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / len2(ax, ay, bx, by)

  return [
    ax + t * (bx - ax),
    ay + t * (by - ay),
  ]
}

const distToSegment2 = (x: number, y: number, ax: number, ay: number, bx: number, by: number): number => {
  let t = ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / len2(ax, ay, bx, by)

  t = Math.max(0, Math.min(1, t))

  return len2(x, y, ax + t * (bx - ax), ay + t * (by - ay))
}

const distToLine2 = (x: number, y: number, ax: number, ay: number, bx: number, by: number): number => {
  const [x1, y1] = projToLine(x, y, ax, ay, bx, by)

  return len2(x, y, x1, y1)
}

const isLineOnLine = (a0x: number, a0y: number, a1x: number, a1y: number, b0x: number, b0y: number, b1x: number, b1y: number): boolean => {
  return isPointOnLine(a0x, a0y, b0x, b0y, b1x, b1y) && isPointOnLine(a1x, a1y, b0x, b0y, b1x, b1y)
}

const isIntersecting = (a0x: number, a0y: number, a1x: number, a1y: number, b0x: number, b0y: number, b1x: number, b1y: number): boolean => {
  const v0x = a1x - a0x
  const v0y = a1y - a0y
  const v1x = b1x - b0x
  const v1y = b1y - b0y
  const cross = v0x * v1y - v1x * v0y

  if (cross === 0) {
    return false
  } // collinear

  const s02_x = a0x - b0x
  const s02_y = a0y - b0y
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

const getSegmentIntersectionPoint = (a0x: number, a0y: number, a1x: number, a1y: number, b0x: number, b0y: number, b1x: number, b1y: number): [number, number] | null => {
  const v0x = a1x - a0x
  const v0y = a1y - a0y
  const v1x = b1x - b0x
  const v1y = b1y - b0y
  const cross = v0x * v1y - v1x * v0y

  if (cross === 0) {
    return null
  } // collinear

  const s02_x = a0x - b0x
  const s02_y = a0y - b0y
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

  return [
    a0x + (t * v0x),
    a0y + (t * v0y),
  ]
}

export const isPointInsideLoop = (x: number, y: number, points: readonly number[], pointsLength: number) => {
  let x0 = points[pointsLength - 2]
  let y0 = points[pointsLength - 1]
  let x1
  let y1
  let inside = false

  for (let i = 0; i < pointsLength; i += 2) {
    x1 = points[i]
    y1 = points[i + 1]

    if (((y1 > y) !== (y0 > y)) && (x < (x0 - x1) * (y - y1) / (y0 - y1) + x1)) {
      inside = !inside
    }

    x0 = x1; y0 = y1
  }

  return inside
}

// const isSegmentIntersectLoop = (p0: Pt, p1: Pt, points: readonly Pt[]): boolean => {
//   for (let i = 0; i < pointsLength; i++) {
//     if (isIntersecting(p0, p1, points[i], points[(i + 1) % pointsLength])) {
//       return true
//     }
//   }

//   return false
// }

export const findPointNearby = (x: number, y: number, points: readonly number[], dist = 8): number | null => {
  const dist2 = dist * dist

  for (let i = 0; i < points.length; i += 2) {
    if (len2(x, y, points[i], points[i + 1]) < dist2) {
      return i
    }
  }

  return null
}

export const isAnyPointNearbyNewEdge = (x: number, y: number, basePtIndex: number, targetPtIndex: number | null, points: readonly number[], dist = 8): boolean => {
  const dist2 = dist * dist
  const bx = points[basePtIndex]
  const by = points[basePtIndex + 1]

  for (let i = 0; i < points.length; i += 2) {
    if (i === basePtIndex || i === targetPtIndex) {
      continue
    }

    const d = distToSegment2(points[i], points[i + 1], x, y, bx, by)

    if (d < dist2) {
      return true
    }
  }

  return false
}

export const findLoopEdgeNearby = (x: number, y: number, points: readonly number[], pointsLength: number, dist = 8): number | null => {
  let lp0x = points[pointsLength - 2]
  let lp0y = points[pointsLength - 1]
  let index = 0
  let min = Infinity

  for (let i = 0; i < pointsLength; i += 2) {
    const lp1x = points[i]
    const lp1y = points[i + 1]

    const d = distToSegment2(x, y, lp0x, lp0y, lp1x, lp1y)

    if (d < min) {
      index = i
      min = d
    }

    lp0x = lp1x
    lp0y = lp1y
  }

  if (min < dist * dist) {
    return index
  }

  return null
}

export const findEdgeNearby = (x: number, y: number, points: readonly number[], edges: readonly number[], dist = 8): number | null => {
  let index = 0
  let min = Infinity

  for (let i = 0; i < edges.length; i += 2) {
    const p0x = points[edges[i]]
    const p0y = points[edges[i] + 1]
    const p1x = points[edges[i + 1]]
    const p1y = points[edges[i + 1] + 1]

    const d = distToSegment2(x, y, p0x, p0y, p1x, p1y)

    if (d < min) {
      index = i
      min = d
    }
  }

  if (min < dist * dist) {
    return index
  }

  return null
}

export const findIntersectionWithLoop = (x: number, y: number, basePtIndex: number, points: readonly number[], pointsLength: number): {point: [number, number], index: number} | null => {
  const x0 = points[basePtIndex]
  const y0 = points[basePtIndex + 1]
  let lp0x = points[pointsLength - 2]
  let lp0y = points[pointsLength - 1]

  const indexes: number[] = []
  const intersectPoints: [number, number][] = []

  // Collect loop intersections
  for (let i = 0; i < pointsLength; i += 2) {
    const lp1x = points[i]
    const lp1y = points[i + 1]

    const pt = getSegmentIntersectionPoint(x0, y0, x, y, lp0x, lp0y, lp1x, lp1y)

    if (pt !== null) {
      intersectPoints.push(pt)
      indexes.push((i - 2 + pointsLength) % pointsLength)
    }

    lp0x = lp1x
    lp0y = lp1y
  }

  if (intersectPoints.length === 0) {
    return null
  }

  if (intersectPoints.length === 1) {
    return {
      index: indexes[0],
      point: intersectPoints[0],
    }
  }

  // Get closest intersection
  let pt = intersectPoints[0]
  let minI = 0
  let minL = len2(x0, y0, pt[0], pt[1])

  for (let i = 1; i < intersectPoints.length; i++) {
    pt = intersectPoints[i]

    const l = len2(x0, y0, pt[0], pt[1])

    if (l < minL) {
      minL = l
      minI = i
    }
  }

  return {
    index: minI,
    point: intersectPoints[minI],
  }
}

export const findIntersectionWithContraint = (x: number, y: number, basePtIndex: number, points: readonly number[], pointsLength: number, constraintEdges: readonly number[]): {point: [number, number], index: number} | null => {
  const x0 = points[basePtIndex]
  const y0 = points[basePtIndex + 1]

  const edgeIndexes: number[] = []
  const intersectPoints: [number, number][] = []

  // Collect edge intersections
  for (let i = 0; i < constraintEdges.length; i += 2) {
    const pi0 = constraintEdges[i]
    const pi1 = constraintEdges[i + 1]

    if (pi0 === basePtIndex || pi1 === basePtIndex) {
      continue
    }

    const pt = getSegmentIntersectionPoint(x0, y0, x, y, points[pi0], points[pi0 + 1], points[pi1], points[pi1 + 1])

    if (pt !== null) {
      intersectPoints.push(pt)
      edgeIndexes.push(i)
    }
  }

  if (intersectPoints.length === 0) {
    return null
  }

  if (intersectPoints.length === 1) {
    return {
      index: edgeIndexes[0],
      point: intersectPoints[0],
    }
  }

  // Get closest intersection
  let pt = intersectPoints[0]
  let minI = 0
  let minL = len2(x0, y0, pt[0], pt[1])

  for (let i = 1; i < intersectPoints.length; i++) {
    pt = intersectPoints[i]

    const l = len2(x0, y0, pt[0], pt[1])

    if (l < minL) {
      minL = l
      minI = i
    }
  }

  return {
    index: edgeIndexes[minI],
    point: intersectPoints[minI],
  }
}

export const isExistingEdge = (i0: number, i1: number, edges: readonly number[]): boolean => {
  for (let i = 0; i < edges.length; i += 2) {
    const ei0 = edges[i]
    const ei1 = edges[i + 1]

    if ((i0 === ei0 && i1 === ei1) || (i0 === ei1 && i1 === ei0)) {
      return true
    }
  }

  return false
}

export const isExistingLoopEdge = (pi0: number, pi1: number, pointsLength: number): boolean => {
  return pi0 < pointsLength && pi1 < pointsLength && (pi0 + 2 === pi1 || pi1 + 2 === pi0)
}

const discardEdge = (edgeIndex: number, indices: number[]) => {
  for (let i = edgeIndex + 2; i < indices.length; i += 2) {
    indices[i - 2] = indices[i]
    indices[i - 1] = indices[i + 1]
  }

  indices.length = indices.length - 2
}
const discardEdges = (indices: number[], edgeIndexes: readonly number[]) => {
  // Mark discarded edges with -1
  for (let i = 0;i < edgeIndexes.length; i++) {
    indices[edgeIndexes[i]] = -1
  }

  for (let i = 0, len = indices.length; i < len; i += 2) {
    if (indices[i] === -1) {
      discardEdge(i, indices)
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

// const isShortestPathRight = (pi0: number, pi1: number, loopLength: number): boolean => {
//   if (Math.abs(pi1 - pi0) < Math.abs(loopLength - pi1 + pi0)) {
//     return pi1 - pi0 >= 0
//   }

//   return pi1 - pi0 < 0
// }

const isMiddleOutsideLoop = (edgeIndex: number, indices: readonly number[], points: readonly number[]) => {
  const ei0 = indices[edgeIndex]
  const ei1 = indices[edgeIndex + 1]

  if (isPointInsideLoop(
    (points[ei0] + points[ei1]) / 2,
    (points[ei0 + 1] + points[ei1 + 1]) / 2,
    points
  )) {
    return false
  }
  // console.log('OUTSIDE', `${ei0}->${ei1}`)

  return true
}

const doesIntersectLoop = (edgeIndex: number, indices: readonly number[], points: readonly number[], pointsLength: number): boolean => {
  const p0 = indices[edgeIndex]
  const p1 = indices[edgeIndex + 1]
  const x0 = points[p0]
  const y0 = points[p0 + 1]
  const x1 = points[p1]
  const y1 = points[p1 + 1]

  if (isMiddleOutsideLoop(edgeIndex, indices, points)) {
    return true
  }

  for (let pi = 0; pi < pointsLength; pi += 2) {
    const pii = (pi + 2) % pointsLength

    if (pi !== p0 && pi !== p1 && pii !== p0 && pii !== p1 && isIntersecting(x0, y0, x1, y1, points[pi], points[pi + 1], points[pii], points[pii + 1])) {
      // console.log('INTER', `${ei0}->${ei1}`, `${pi}->${npi}`)

      return true
    }
  }

  return false
}

export const calcEdges = (points: readonly number[], pointsLength: number): number[] => {
  const indices: number[] = []

  const discardLongerEdges = (edgeIndex: number, /* out */discardedEdgeIndexes: number[]) => {
    discardedEdgeIndexes.length = 0

    const pi0 = indices[edgeIndex]
    const pi1 = indices[edgeIndex + 1]
    const x0 = points[pi0]
    const y0 = points[pi0 + 1]
    const x1 = points[pi1]
    const y1 = points[pi1 + 1]
    const len = len2(x0, y0, x1, y1)

    // console.log(`----- ${pi0 / 2}->${pi1 / 2}`)

    for (let i = 0; i < indices.length; i += 2) {
      if (i === edgeIndex) {
        continue
      }

      const i0 = indices[i]
      const i1 = indices[i + 1]

      // console.log(`  CHECK ${pi0 / 2}->${pi1 / 2} vs ${i0 / 2}->${i1 / 2}`)

      if (
        pi0 !== i0 &&
        pi0 !== i1 &&
        pi1 !== i0 &&
        pi1 !== i1 &&
        isIntersecting(x0, y0, x1, y1, points[i0], points[i0 + 1], points[i1], points[i1 + 1])
      ) {
        // console.log(`    INTER ${pi0 / 2}->${pi1 / 2} vs ${i0 / 2}->${i1 / 2}`)

        if (len2(points[i0], points[i0 + 1], points[i1], points[i1 + 1]) < len) {
          // Is not shorter
          // console.log('  DISCARD SOURCE')
          discardedEdgeIndexes.length = 0
          discardedEdgeIndexes.push(edgeIndex)

          return
        }

        // Is shorter
        discardedEdgeIndexes.push(i)
      }
    }

    // console.log('  DISCARD COMPARANTS')
  }

  const isSameEdgeButReversed = (i0: number, i1: number): boolean => {
    for (let e = 0; e < indices.length; e += 2) {
      // Same edge exists, but reversed
      if (indices[e] === i1 && indices[e + 1] === i0) {
        return true
      }
    }

    return false
  }

  // Generate edges
  for (let i = 0; i < pointsLength; i += 2) {
    // console.log('------------------ I:', i)

    for (let k = (i + 4) % pointsLength; k !== (i - 2 + pointsLength) % pointsLength; k = ((k + 2) % pointsLength)) {
      // console.log(i, '->', k)

      // Same edge exists, but reversed
      if (isSameEdgeButReversed(i, k)) {
        // console.log('SAME REVERSED')
        continue
      }

      indices.push(i, k)
    }
  }

  const tempNumbers: number[] = []

  for (let i = 0, len = indices.length; i < len; i += 2) {
    if (doesIntersectLoop(i, indices, points)) {
      discardEdge(i, indices)
      i -= 2
      len -= 2

      continue
    }

    //New edge intersects others
    discardLongerEdges(i, tempNumbers)

    if (tempNumbers.length > 0) {
      // console.log('LONGER EDGES', `${indices[i]} -> ${indices[i + 1]}`, tempNumbers.map((i) => `${indices[i]} -> ${indices[i + 1]}`))
      discardEdges(indices, tempNumbers)
      i -= 2 * getNumDiscardedIndexesLessThan(i, tempNumbers)
      len -= 2 * tempNumbers.length

      continue
    }
  }

  return indices
}

export const getLoopAABB = (points: readonly number[], pointsLength: number): number[] => {
  let minX = points[0]
  let minY = points[1]
  let maxX = minX
  let maxY = minY

  for (let i = 2; i < pointsLength; i += 2) {
    const ptx = points[i]
    const pty = points[i + 1]

    minX = Math.min(minX, ptx)
    maxX = Math.max(maxX, ptx)
    minY = Math.min(minY, pty)
    maxY = Math.max(maxY, pty)
  }

  return [
    minX,
    minY,
    maxX,
    minY,
    maxX,
    maxY,
    minX,
    maxY,
  ]
}

export const getPointOutsideBB = (aabb: readonly number[]): [number, number] => {
  return [aabb[4] + 100, aabb[5] + 100]
}

export const isLoopInverted = (points: readonly number[]) => {
  const aabb = getLoopAABB(points)
  const [x, y] = getPointOutsideBB(aabb)

  return isPointInsideLoop(x, y, points)
}
