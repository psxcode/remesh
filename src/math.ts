/* eslint-disable no-param-reassign */
/* eslint-disable max-params */
const len2 = (x0: number, y0: number, x1: number, y1: number): number => {
  return (x0 - x1) ** 2 + (y0 - y1) ** 2
}

// const cross = (x: number, y: number, ax: number, ay: number, bx: number, by: number) => {
//   return (x - ax) * (by - ay) - (bx - ax) * (y - ay)
// }

// const isPointOnLine = (x: number, y: number, ax: number, ay: number, bx: number, by: number): boolean => {
//   return cross(x, y, ax, ay, bx, by) === 0
// }

// const isPointInsideSegment = (x: number, y: number, ax: number, ay: number, bx: number, by: number): boolean => {
//   return cross(x, y, ax, ay, bx, by) < 0
// }

// const projToSegment = (x: number, y: number, ax: number, ay: number, bx: number, by: number): [number, number] => {
//   // Subtract (b - a) and (p - a), to base 2 vectors on (a) point
//   // Calc dot-product
//   // Divide result by (b - a) length to get projected (p - a) length
//   let t = ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / len2(ax, ay, bx, by)

//   // Clamp to segment bounds
//   t = Math.max(0, Math.min(1, t))

//   // Contruct projected point
//   return [
//     ax + t * (bx - ax),
//     ay + t * (by - ay),
//   ]
// }

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

// const distToLine2 = (x: number, y: number, ax: number, ay: number, bx: number, by: number): number => {
//   const [x1, y1] = projToLine(x, y, ax, ay, bx, by)

//   return len2(x, y, x1, y1)
// }

// const isLineOnLine = (a0x: number, a0y: number, a1x: number, a1y: number, b0x: number, b0y: number, b1x: number, b1y: number): boolean => {
//   return isPointOnLine(a0x, a0y, b0x, b0y, b1x, b1y) && isPointOnLine(a1x, a1y, b0x, b0y, b1x, b1y)
// }

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

// const isSegmentIntersectLoop = (p0: Pt, p1: Pt, points: readonly Pt[]): boolean => {
//   for (let i = 0; i < pointsLength; i++) {
//     if (isIntersecting(p0, p1, points[i], points[(i + 1) % pointsLength])) {
//       return true
//     }
//   }

//   return false
// }

const isPointInSegmentABBB = (x: number, y: number, x0: number, y0: number, x1: number, y1: number): boolean => {
  if (x0 > x1) {
    const t = x0

    x0 = x1
    x1 = t
  }

  if (y0 > y1) {
    const t = y0

    y0 = y1
    y1 = t
  }

  return x0 < x && x < x1 && y0 < y && y < y1
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

// export const getPointOutsideBB = (aabb: readonly number[]): [number, number] => {
//   return [aabb[4] + 100, aabb[5] + 100]
// }

// export const isLoopInverted = (points: readonly number[]) => {
//   const aabb = getLoopAABB(points)
//   const [x, y] = getPointOutsideBB(aabb)

//   return isPointInsideLoop(x, y, points)
// }

export class Points {
  _points: number[] = []
  _loopLength: number = 0
  _edges: number[] = []

  get numLoopPoints() {
    return this._loopLength / 2
  }

  get numPoints() {
    return this._points.length / 2
  }

  get numEdges() {
    return this._edges.length / 2
  }

  get pointsFlatArray(): readonly number[] {
    return this._points
  }

  get edgesFlatArray(): readonly number[] {
    return this._edges
  }

  reset() {
    this._points.length = 0
    this._edges.length = 0
    this._loopLength = 0
  }

  validate() {
    const points: readonly number[] = this._points
    const edges: readonly number[] = this._edges

    for (let i = 0; i < points.length; i++) {
      if (points[i] === null) {
        console.error('POINTS_ERROR')
        console.log(points)
      }
    }

    for (let i = 0; i < edges.length; i += 2) {
      if (edges[i] === edges[i + 1]) {
        console.error('EDGES_ERROR')
        console.log(edges)
      }
    }
  }

  isPointInsideLoop(x: number, y: number) {
    const points = this.pointsFlatArray
    const loopLength = this._loopLength
    let x0 = points[loopLength - 2]
    let y0 = points[loopLength - 1]
    let x1
    let y1
    let inside = false

    for (let i = 0; i < loopLength; i += 2) {
      x1 = points[i]
      y1 = points[i + 1]

      if (((y1 > y) !== (y0 > y)) && (x < (x0 - x1) * (y - y1) / (y0 - y1) + x1)) {
        inside = !inside
      }

      x0 = x1
      y0 = y1
    }

    return inside
  }

  findLoopEdgeNearby(x: number, y: number, dist = 8): number | null {
    if (this.numLoopPoints < 3) {
      return null
    }

    const points = this.pointsFlatArray
    const loopLength = this._loopLength

    let prevI = loopLength - 2
    let lp0x = points[prevI]
    let lp0y = points[prevI + 1]
    let index = 0
    let min = Infinity

    for (let i = 0; i < loopLength; i += 2) {
      const lp1x = points[i]
      const lp1y = points[i + 1]

      const d = distToSegment2(x, y, lp0x, lp0y, lp1x, lp1y)

      if (d < min) {
        index = prevI
        min = d
      }

      prevI = i
      lp0x = lp1x
      lp0y = lp1y
    }

    if (min < dist * dist) {
      return index / 2
    }

    return null
  }

  findEdgeNearby(x: number, y: number, dist = 8): number | null {
    const points = this.pointsFlatArray
    const edges = this.edgesFlatArray
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
      return index / 2
    }

    return null
  }

  isExistingEdge(p0: number, p1: number): boolean {
    const edges = this.edgesFlatArray

    p0 *= 2
    p1 *= 2

    for (let i = 0; i < edges.length; i += 2) {
      const ei0 = edges[i]
      const ei1 = edges[i + 1]

      if ((p0 === ei0 && p1 === ei1) || (p0 === ei1 && p1 === ei0)) {
        return true
      }
    }

    return false
  }

  isExistingLoopEdge(pi0: number, pi1: number): boolean {
    const numLoopPoints = this.numLoopPoints

    return pi0 < numLoopPoints && pi1 < numLoopPoints &&
     ((pi0 + 1) % numLoopPoints === pi1 || (pi1 + 1) % numLoopPoints === pi0)
  }

  private discardEdge(edges: number[], edgeIndex: number) {
    for (let i = edgeIndex + 2; i < edges.length; i += 2) {
      edges[i - 2] = edges[i]
      edges[i - 1] = edges[i + 1]
    }

    edges.length = edges.length - 2
  }

  private discardEdges(edges: number[], edgeIndexes: readonly number[]) {
    // Mark discarded edges with -1
    for (let i = 0;i < edgeIndexes.length; i++) {
      edges[edgeIndexes[i]] = -1
    }

    for (let i = 0, len = edges.length; i < len; i += 2) {
      if (edges[i] === -1) {
        this.discardEdge(edges, i)
        i -= 2
        len -= 2
      }
    }
  }

  private isMiddleOutsideLoop(flatEdgeIndex: number) {
    const edges: readonly number[] = this._edges
    const points: readonly number[] = this._points
    const ei0 = edges[flatEdgeIndex]
    const ei1 = edges[flatEdgeIndex + 1]

    return this.isPointInsideLoop(
      (points[ei0] + points[ei1]) / 2,
      (points[ei0 + 1] + points[ei1 + 1]) / 2
    )
  }

  private doesIntersectLoop(flatEdgeIndex: number): boolean {
    if (this.isMiddleOutsideLoop(flatEdgeIndex)) {
      return true
    }

    const edges = this.edgesFlatArray
    const points = this.pointsFlatArray
    const loopLength = this._loopLength
    const p0 = edges[flatEdgeIndex]
    const p1 = edges[flatEdgeIndex + 1]
    const x0 = points[p0]
    const y0 = points[p0 + 1]
    const x1 = points[p1]
    const y1 = points[p1 + 1]
    let pii = loopLength - 2

    for (let pi = 0; pi < loopLength; pi += 2) {
      if (pi !== p0 && pi !== p1 && pii !== p0 && pii !== p1 &&
        isIntersecting(x0, y0, x1, y1, points[pi], points[pi + 1], points[pii], points[pii + 1])) {
        return true
      }

      pii = pi
    }

    return false
  }

  calcEdges() {
    const points = this.pointsFlatArray
    const loopLength = this._loopLength
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

        const i0 = this._edges[i]
        const i1 = this._edges[i + 1]

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
    for (let i = 0; i < loopLength; i += 2) {
    // console.log('------------------ I:', i)

      for (let k = (i + 4) % loopLength; k !== (i - 2 + loopLength) % loopLength; k = ((k + 2) % loopLength)) {
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
      if (this.doesIntersectLoop(i)) {
        this.discardEdge(indices, i)
        i -= 2
        len -= 2

        continue
      }

      //New edge intersects others
      discardLongerEdges(i, tempNumbers)

      if (tempNumbers.length > 0) {
      // console.log('LONGER EDGES', `${indices[i]} -> ${indices[i + 1]}`, tempNumbers.map((i) => `${indices[i]} -> ${indices[i + 1]}`))
        this.discardEdges(indices, tempNumbers)
        i -= 2 * getNumDiscardedIndexesLessThan(i, tempNumbers)
        len -= 2 * tempNumbers.length

        continue
      }
    }
  }

  findIntersectionWithEdge(x: number, y: number, basePointIndex: number): {point: [number, number], index: number} | null {
    const bpi = basePointIndex * 2
    const points = this.pointsFlatArray
    const edges = this.edgesFlatArray

    const x0 = points[bpi]
    const y0 = points[bpi + 1]

    const flatEdgeIndexes: number[] = []
    const intersectPoints: [number, number][] = []

    // Collect edge intersections
    for (let i = 0; i < edges.length; i += 2) {
      const pi0 = edges[i]
      const pi1 = edges[i + 1]

      if (pi0 === bpi || pi1 === bpi) {
        continue
      }

      const pt = getSegmentIntersectionPoint(x0, y0, x, y, points[pi0], points[pi0 + 1], points[pi1], points[pi1 + 1])

      if (pt !== null) {
        intersectPoints.push(pt)
        flatEdgeIndexes.push(i)
      }
    }

    if (intersectPoints.length === 0) {
      return null
    }

    if (intersectPoints.length === 1) {
      return {
        index: flatEdgeIndexes[0] / 2,
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
      index: flatEdgeIndexes[minI] / 2,
      point: intersectPoints[minI],
    }
  }

  findIntersectionWithLoop(x: number, y: number, basePointIndex: number): {point: [number, number], index: number} | null {
    if (this.numLoopPoints < 3) {
      return null
    }

    const bpi = basePointIndex * 2
    const points = this.pointsFlatArray
    const loopLength = this._loopLength

    const x0 = points[bpi]
    const y0 = points[bpi + 1]
    let prevI = loopLength - 2
    let lp0x = points[prevI]
    let lp0y = points[prevI + 1]

    const flatPointIndexes: number[] = []
    const intersectPoints: [number, number][] = []

    // Collect loop intersections
    for (let i = 0; i < loopLength; i += 2) {
      const lp1x = points[i]
      const lp1y = points[i + 1]

      if (i !== bpi && prevI !== bpi) {
        const pt = getSegmentIntersectionPoint(x0, y0, x, y, lp0x, lp0y, lp1x, lp1y)

        if (pt !== null) {
          intersectPoints.push(pt)
          flatPointIndexes.push(prevI)
        }
      }

      prevI = i
      lp0x = lp1x
      lp0y = lp1y
    }

    if (intersectPoints.length === 0) {
      return null
    }

    if (intersectPoints.length === 1) {
      return {
        index: flatPointIndexes[0] / 2,
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
      index: minI / 2,
      point: intersectPoints[minI],
    }
  }

  doesPointBelongToEdge(edgeIndex: number, pointIndex: number): boolean {
    const edges: readonly number[] = this._edges
    const ei = edgeIndex * 2

    return pointIndex === edges[ei] / 2 || pointIndex === edges[ei + 1] / 2
  }

  doesPointBelongToLoopEdge(edgeIndex: number, pointIndex: number): boolean {
    return edgeIndex === pointIndex || (edgeIndex + 1) % this.numLoopPoints === pointIndex
  }

  getLoopAABB(): number[] {
    let minX = this._points[0]
    let minY = this._points[1]
    let maxX = minX
    let maxY = minY

    for (let i = 2; i < this._loopLength; i += 2) {
      const ptx = this._points[i]
      const pty = this._points[i + 1]

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

  isAnyPointNearbyEdge(basePointIndex: number, targetPointIndex: number, dist = 8): boolean {
    const points = this.pointsFlatArray
    const dist2 = dist * dist
    const bpi = basePointIndex * 2
    const tpi = targetPointIndex * 2
    const bx = points[bpi]
    const by = points[bpi + 1]
    const tx = points[tpi]
    const ty = points[tpi + 1]

    for (let i = 0; i < points.length; i += 2) {
      if (i === bpi || i === tpi) {
        continue
      }

      const x = points[i]
      const y = points[i + 1]

      if (!isPointInSegmentABBB(x, y, tx, ty, bx, by)) {
        continue
      }

      const d = distToSegment2(x, y, tx, ty, bx, by)

      if (d < dist2) {
        return true
      }
    }

    return false
  }

  isAnyPointNearbyNewEdge(tx: number, ty: number, basePointIndex: number, dist = 8): boolean {
    const points = this.pointsFlatArray
    const dist2 = dist * dist
    const bpi = basePointIndex * 2
    const bx = points[bpi]
    const by = points[bpi + 1]

    for (let i = 0; i < points.length; i += 2) {
      if (i === bpi) {
        continue
      }

      const x = points[i]
      const y = points[i + 1]

      if (!isPointInSegmentABBB(x, y, tx, ty, bx, by)) {
        continue
      }

      const d = distToSegment2(x, y, tx, ty, bx, by)

      if (d < dist2) {
        return true
      }
    }

    return false
  }

  findPointOnEdgeNearby(x: number, y: number, edgeIndex: number, dist = 8): number | null {
    const points = this.pointsFlatArray
    const edges = this.edgesFlatArray
    const ei = edgeIndex * 2
    const pi0 = edges[ei]
    const pi1 = edges[ei + 1]
    const dist2 = dist * dist

    if (len2(x, y, points[pi0], points[pi0 + 1]) < dist2) {
      return pi0 / 2
    }

    if (len2(x, y, points[pi1], points[pi1 + 1]) < dist2) {
      return pi1 / 2
    }

    return null
  }

  findPointOnLoopNearby(x: number, y: number, loopEdgeIndex: number, dist = 8): number | null {
    const points = this.pointsFlatArray
    const pi0 = loopEdgeIndex * 2
    const pi1 = (pi0 + 2) % this._loopLength
    const dist2 = dist * dist

    if (len2(x, y, points[pi0], points[pi0 + 1]) < dist2) {
      return pi0 / 2
    }

    if (len2(x, y, points[pi1], points[pi1 + 1]) < dist2) {
      return pi1 / 2
    }

    return null
  }

  findPointNearby(x: number, y: number, dist = 8): number | null {
    const points: readonly number[] = this._points
    const dist2 = dist * dist

    for (let i = 0; i < points.length; i += 2) {
      if (len2(x, y, points[i], points[i + 1]) < dist2) {
        return i / 2
      }
    }

    return null
  }

  projToLoop(x: number, y: number, afterLoopPointIndex: number): [number, number] {
    const points = this._points
    const pi = afterLoopPointIndex * 2
    const pin = (pi + 2) % this._loopLength

    return projToLine(x, y, points[pi], points[pi + 1], points[pin], points[pin + 1])
  }

  projToEdge(x: number, y: number, edgeIndex: number): [number, number] {
    const points: readonly number[] = this._points
    const edges: readonly number[] = this._edges
    const ei = edgeIndex * 2
    const epi0 = edges[ei]
    const epi1 = edges[ei + 1]

    return projToLine(x, y, points[epi0], points[epi0] + 1, points[epi1], points[epi1] + 1)
  }

  insertPointIntoLoop(x: number, y: number, afterPointIndex: number): number {
    // Check num points is low
    if (this.numLoopPoints <= 1) {
      this.addLoopPoint(x, y)

      return this.numPoints - 1
    }

    const pi = Math.min(afterPointIndex * 2, this._loopLength)

    this._points.splice(pi + 2, 0, x, y)
    this._loopLength += 2

    // Fix edge indexes
    const edges = this._edges

    for (let i = 0; i < edges.length; i++) {
      if (edges[i] > pi) {
        edges[i] += 2
      }
    }

    return (pi + 2) / 2
  }

  insertPointIntoEdge(x: number, y: number, edgeIndex: number): number {
    const ei = edgeIndex * 2
    const epi0 = this._edges[ei]
    const epi1 = this._edges[ei + 1]
    const epi2 = this._points.length

    this._points.push(x, y)
    this._edges.splice(ei, 2, epi0, epi2, epi2, epi1)

    return epi2 / 2
  }

  addEdge(p0: number, p1: number) {
    this._edges.push(p0 * 2, p1 * 2)
  }

  // TODO fix indexing
  addLoopPoint(x: number, y: number) {
    if (this._points.length > this._loopLength) {
      return
    }

    this._points.push(x, y)
    this._loopLength += 2
  }

  addPoint(x: number, y: number) {
    this._points.push(x, y)
  }

  serialize(): string {
    return JSON.stringify({
      points: this._points,
      edges: this._edges,
      loopLength: this._loopLength,
    })
  }

  deserialize(data: string) {
    const { points, edges, loopLength } = JSON.parse(data)

    this._points = points
    this._edges = edges
    this._loopLength = loopLength
  }
}
