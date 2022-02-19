/* eslint-disable sort-vars */
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

// const projToSegment = (x: number, y: number, ax: number, ay: number, bx: number, by: number): Point => {
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

export const projToLine = (x: number, y: number, ax: number, ay: number, bx: number, by: number): Point => {
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

const getSegmentIntersectionPoint = (a0x: number, a0y: number, a1x: number, a1y: number, b0x: number, b0y: number, b1x: number, b1y: number): Point | null => {
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

export const POINT_DATA_LENGTH = 2
export const EDGE_DATA_LENGTH = 2
export const MESH_EDGE_DATA_LENGTH = 2

const toFlatPtIndex = (ptIndex: number): number => {
  return ptIndex * POINT_DATA_LENGTH
}

const toPtIndex = (flatPtIndex: number): number => {
  return flatPtIndex / POINT_DATA_LENGTH
}

const toFlatEdgeIndex = (edgeIndex: number): number => {
  return edgeIndex * EDGE_DATA_LENGTH
}

const toEdgeIndex = (flatEdgeIndex: number): number => {
  return flatEdgeIndex / EDGE_DATA_LENGTH
}

const toMaybePtIndex = (flatPtIndex: number | null): number | null => {
  return flatPtIndex !== null ? flatPtIndex / POINT_DATA_LENGTH : null
}

const toMaybeEdgeIndex = (flatEdgeIndex: number | null): number | null => {
  return flatEdgeIndex !== null ? flatEdgeIndex / EDGE_DATA_LENGTH : null
}

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

const discardEdges = (edges: number[], discardIndexes: readonly number[]) => {
  // Mark discarded edges with -1
  for (let i = 0; i < discardIndexes.length; i++) {
    edges[discardIndexes[i]] = -1
  }

  for (let ei = 0, len = edges.length; ei < len; ei += EDGE_DATA_LENGTH) {
    // Find marked edges
    if (edges[ei] === -1) {
      // Shift next edges data over the previous
      for (let i = ei + EDGE_DATA_LENGTH; i < edges.length; i += EDGE_DATA_LENGTH) {
        edges[i - EDGE_DATA_LENGTH] = edges[i]
        edges[i - EDGE_DATA_LENGTH + 1] = edges[i + 1]
      }

      // Subtract removed edge indexes
      edges.length = edges.length - EDGE_DATA_LENGTH
      ei -= EDGE_DATA_LENGTH
      len -= EDGE_DATA_LENGTH
    }
  }
}

const isPointInsideLoop = (x: number, y: number, points: readonly number[], flatLoopStart: number, flatLoopEnd: number): boolean => {
  let x0 = points[flatLoopEnd - POINT_DATA_LENGTH]
  let y0 = points[flatLoopEnd - POINT_DATA_LENGTH + 1]
  let x1
  let y1
  let inside = false

  for (let i = flatLoopStart; i < flatLoopEnd; i += POINT_DATA_LENGTH) {
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

const findLoopEdgeNearby = (x: number, y: number, points: cPointsData, flatLoopStart: number, flatLoopEnd: number, dist: number): number | null => {
  let prevI = flatLoopEnd - POINT_DATA_LENGTH
  let lp0x = points[prevI]
  let lp0y = points[prevI + 1]
  const nearbyMinDist = dist * dist

  for (let i = flatLoopStart; i < flatLoopEnd; i += POINT_DATA_LENGTH) {
    const lp1x = points[i]
    const lp1y = points[i + 1]

    const d = distToSegment2(x, y, lp0x, lp0y, lp1x, lp1y)

    if (d < nearbyMinDist) {
      return prevI
    }

    prevI = i
    lp0x = lp1x
    lp0y = lp1y
  }

  return null
}

const getAABB = (points: readonly number[], flatFrom: number, flatTo: number): AABB => {
  let minX = points[flatFrom]
  let minY = points[flatFrom + 1]
  let maxX = minX
  let maxY = minY

  for (let i = POINT_DATA_LENGTH + flatFrom; i < flatTo; i += POINT_DATA_LENGTH) {
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
    maxY,
  ]
}

const isAnyPointNearbyEdge = (points: cPointsData, flatBpi: number, flatTpi: number, dist: number): boolean => {
  const dist2 = dist * dist
  const bx = points[flatBpi]
  const by = points[flatBpi + 1]
  const tx = points[flatTpi]
  const ty = points[flatTpi + 1]

  // console.log(`${bpi / 2}->${tpi / 2}`)

  for (let i = 0; i < points.length; i += POINT_DATA_LENGTH) {
    if (i === flatBpi || i === flatTpi) {
      continue
    }

    const x = points[i]
    const y = points[i + 1]

    if (!isPointInSegmentABBB(x, y, tx, ty, bx, by)) {
      // console.log(`  ${i / 2} NOT_IN_AABB`)
      continue
    }

    const d2 = distToSegment2(x, y, tx, ty, bx, by)

    // console.log(`  ${i / 2} = ${Math.sqrt(d2)}`)

    if (d2 < dist2) {
      // console.log('  NEARBY')

      return true
    }
  }

  return false
}

const isAnyPointNearbyNewEdge = (points: cPointsData, tx: number, ty: number, flBpi: number, dist: number): boolean => {
  const dist2 = dist * dist
  const bx = points[flBpi]
  const by = points[flBpi + 1]

  for (let i = 0; i < points.length; i += POINT_DATA_LENGTH) {
    if (i === flBpi) {
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

const findPointNearby = (x: number, y: number, points: cPointsData, dist: number, flatFrom: number, flatTo: number): number | null => {
  const dist2 = dist * dist

  for (let i = flatFrom; i < flatTo; i += POINT_DATA_LENGTH) {
    if (len2(x, y, points[i], points[i + 1]) < dist2) {
      return i
    }
  }

  return null
}

type PointsData = number[]
type cPointsData = readonly number[]
type Point = [number, number]
type AABB = [number, number, number, number]
type cAABB = readonly [number, number, number, number]

export class Remesh {
  _points: number[] = []
  _loopLength: number[] = [0]
  _edges: number[] = []
  _meshEdges: number[] = []

  _cloudPoints: number[] = []
  _cloudEdges: number[] = []

  get numLoops() {
    return this._loopLength.length
  }

  get numLoopPoints() {
    return toPtIndex(this._loopLength[this._loopLength.length - 1])
  }

  get numLastLoopPoints() {
    const loopStart = this._loopLength.length <= 1 ? 0 : this._loopLength[this._loopLength.length - 2]
    const loopEnd = this._loopLength[this._loopLength.length - 1]

    return toPtIndex(loopEnd - loopStart)
  }

  get numPoints() {
    return toPtIndex(this._points.length)
  }

  get numEdges() {
    return this._edges.length / EDGE_DATA_LENGTH
  }

  get numMeshEdges() {
    return this._meshEdges.length / MESH_EDGE_DATA_LENGTH
  }

  get pointsFlatArray(): readonly number[] {
    return this._points
  }

  get edgesFlatArray(): readonly number[] {
    return this._edges
  }

  get meshEdgesFlatArray(): readonly number[] {
    return this._meshEdges
  }

  get cloudPointsFlatArray(): readonly number[] {
    return this._cloudPoints
  }

  get cloudEdgesFlatArray(): readonly number[] {
    return this._cloudEdges
  }

  getNumLoopPoints(loopIndex: number): number {
    if (loopIndex < 0 || loopIndex >= this._loopLength.length) {
      return 0
    }

    return this._loopLength[loopIndex]
  }

  clearAll() {
    this.clearEdges()
    this.clearCloud()
    this._points.length = 0
    this._loopLength = [0]
  }

  clearCloud() {
    this._cloudPoints.length = 0
    this._cloudEdges.length = 0
    this._meshEdges.length = 0
  }

  clearEdges() {
    this.clearCloud()
    this._edges.length = 0
    this._points.length = this._loopLength[this._loopLength.length - 1]
  }

  clearLastLoop() {
    this.clearCloud()
    this.clearEdges()

    this._loopLength.length -= 1
    this._points.length = this._loopLength.length === 0 ? 0 : this._loopLength[this._loopLength.length - 1]
  }

  validate() {
    const points = this.pointsFlatArray
    const edges = this.edgesFlatArray

    for (let i = 0; i < points.length; i++) {
      if (points[i] === null) {
        console.error('POINTS_ERROR')
        console.log(points)
      }
    }

    for (let i = 0; i < edges.length; i += EDGE_DATA_LENGTH) {
      if (edges[i] === edges[i + 1]) {
        console.error('EDGES_ERROR')
        console.log(edges)
      }
    }
  }

  isPointInsideLoops(x: number, y: number): boolean {
    const points = this.pointsFlatArray

    if (!isPointInsideLoop(x, y, points, 0, this._loopLength[0])) {
      return false
    }

    for (let i = 1; i < this._loopLength.length; i++) {
      // Note inverted test for inner loops
      if (isPointInsideLoop(x, y, points, this._loopLength[i - 1], this._loopLength[i])) {
        return false
      }
    }

    return true
  }

  isNewLoopPointInsideOtherLoops(x: number, y: number): boolean {
    const points = this.pointsFlatArray

    if (!isPointInsideLoop(x, y, points, 0, this._loopLength[0])) {
      return false
    }

    for (let i = 1; i < this._loopLength.length - 1; i++) {
      // Note inverted test for inner loops
      if (isPointInsideLoop(x, y, points, this._loopLength[i - 1], this._loopLength[i])) {
        return false
      }
    }

    return true
  }

  findLoopEdgeNearby(x: number, y: number, dist = 8): number | null {
    if (this.numLoopPoints < 3) {
      return null
    }

    const points = this.pointsFlatArray

    for (let i = 0 ; i < this._loopLength.length; i++) {
      const flatEdgeIndexNearby = findLoopEdgeNearby(x, y, points, i === 0 ? 0 : this._loopLength[i - 1], this._loopLength[i], dist)

      if (flatEdgeIndexNearby !== null) {
        return toEdgeIndex(flatEdgeIndexNearby)
      }
    }

    return null
  }

  findEdgeNearby(x: number, y: number, dist = 8): number | null {
    const points = this.pointsFlatArray
    const edges = this.edgesFlatArray
    let index = 0
    let min = Infinity

    for (let i = 0; i < edges.length; i += EDGE_DATA_LENGTH) {
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
      return toEdgeIndex(index)
    }

    return null
  }

  isExistingEdge(pi0: number, pi1: number): boolean {
    const edges = this.edgesFlatArray

    const p0 = toFlatPtIndex(pi0)
    const p1 = toFlatPtIndex(pi1)

    for (let i = 0; i < edges.length; i += EDGE_DATA_LENGTH) {
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

  doesNewLoopEdgeIntersectOtherLoops(x: number, y: number, basePointIndex: number): boolean {
    const points = this.pointsFlatArray
    const bpi = toFlatPtIndex(basePointIndex)
    const x0 = points[bpi]
    const y0 = points[bpi + 1]

    for (let li = 0; li < this._loopLength.length - 1; li++) {
      const loopStart = li === 0 ? 0 : this._loopLength[li - 1]
      const loopEnd = this._loopLength[li]

      let pii = loopEnd - 2

      for (let pi = loopStart; pi < loopEnd; pi += POINT_DATA_LENGTH) {
        if (pi !== bpi && pii !== bpi &&
        isIntersecting(x0, y0, x, y, points[pi], points[pi + 1], points[pii], points[pii + 1])) {
          return true
        }

        pii = pi
      }
    }

    return false
  }

  generatePCloud(dist: number) {
    this.clearCloud()

    if (!Number.isInteger(dist) || dist <= 0) {
      throw new Error(`generatePCloud: dist:${dist}`)
    }

    const points = this._cloudPoints
    const edges = this._cloudEdges
    const origPoints: readonly number[] = this._points
    const origPointsLength: readonly number[] = this._loopLength
    const origEdges: readonly number[] = this._edges

    // Copy loops as edges
    for (let li = 0 ; li < origPointsLength.length; li++) {
      const loopStart = li === 0 ? 0 : origPointsLength[li - 1]
      const loopEnd = origPointsLength[li]
      const loopDiff = loopEnd - loopStart

      for (let pi = loopStart; pi < loopEnd; pi += POINT_DATA_LENGTH) {
        points.push(origPoints[pi], origPoints[pi + 1])
        edges.push(pi, (pi + POINT_DATA_LENGTH - loopStart) % loopDiff + loopStart)
      }
    }

    // Copy rest points
    for (let pi = origPointsLength[origPointsLength.length - 1]; pi < origPoints.length; pi++) {
      points.push(origPoints[pi])
    }

    // Copy constraint edges
    for (let ei = 0; ei < origEdges.length; ei++) {
      edges.push(origEdges[ei])
    }

    // Subdivide edges
    for (let ei = 0, elen = edges.length; ei < elen; ei += EDGE_DATA_LENGTH) {
      const p0 = edges[ei]
      const p1 = edges[ei + 1]
      const x0 = points[p0]
      const y0 = points[p0 + 1]
      const x1 = points[p1]
      const y1 = points[p1 + 1]

      const edgeLen = Math.sqrt(len2(x0, y0, x1, y1))
      const numSubs = Math.ceil(edgeLen / dist / 3)

      if (numSubs > 1) {
        const xStep = (x1 - x0) / numSubs
        const yStep = (y1 - y0) / numSubs
        let lpi = points.length

        edges[ei + 1] = lpi
        points.push(x0 + xStep, y0 + yStep)

        for (let si = 2; si < numSubs; si++) {
          const px = x0 + xStep * si
          const py = y0 + yStep * si
          const npi = points.length

          points.push(px, py)
          edges.push(lpi, npi)
          lpi = npi
        }

        edges.push(lpi, p1)
      }
    }

    const pointsLength = points.length

    // Point cloud
    const aabb: cAABB = getAABB(this.pointsFlatArray, 0, this._loopLength[0])
    const loopMinDist = dist * 1.1
    const edgeMinDist = dist * 1.1
    const xstep = dist
    const ystep = dist * 1.777
    const hystep = ystep * 0.5
    const xoffset = (aabb[2] - aabb[0]) % xstep * 0.5
    const yoffset = (aabb[3] - aabb[1]) % ystep * 0.5
    const strides: readonly [number[], number[], number[]] = [[], [], []]

    for (let x = aabb[0] + xoffset, xi = 0; x < aabb[2]; x += xstep, xi++) {
      let lpi = -1
      const xi2 = xi % 2
      const currentStrideIndex = xi % 3

      for (let y = aabb[1] + yoffset + xi2 * hystep, yi = 0; y < aabb[3]; y += ystep, yi++) {
        if (
          !this.isPointInsideLoops(x, y) ||
          this.findLoopEdgeNearby(x, y, loopMinDist) !== null ||
          this.findEdgeNearby(x, y, edgeMinDist) !== null ||
          this.findEdgePointNearby(x, y, edgeMinDist) !== null
        ) {
          lpi = -1
          strides[currentStrideIndex].push(lpi)
          continue
        }

        points.push(x, y)

        // Strides
        if (lpi >= 0) {
          const npi = points.length - 2

          edges.push(lpi, npi)
        }

        lpi = points.length - 2

        strides[currentStrideIndex].push(lpi)

        const leftPointIndex0 = strides[(currentStrideIndex + 2) % strides.length][yi]
        const leftPointIndex1 = strides[(currentStrideIndex + 2) % strides.length][yi + (xi2 * 2 - 1)]

        if (leftPointIndex0 >= 0) {
          edges.push(leftPointIndex0, lpi)
        }

        if (leftPointIndex1 >= 0) {
          edges.push(leftPointIndex1, lpi)
        }

        if (leftPointIndex0 < 0 || leftPointIndex1 < 0) {
          const leftPointIndex2 = strides[(currentStrideIndex + 1) % strides.length][yi]

          if (leftPointIndex2 >= 0) {
            edges.push(leftPointIndex2, lpi)
          }
        }
      }

      strides[(currentStrideIndex + 1) % strides.length].length = 0
    }

    const meshEdges = this._meshEdges

    const doesEdgeExists = (pi: number, pii: number): boolean => {
      // console.log('-----------')

      for (let ei = 0; ei < edges.length; ei += EDGE_DATA_LENGTH) {
        const epi = edges[ei]
        const epii = edges[ei + 1]

        // console.log(`${pi / 2}->${pii / 2}:${epi / 2}->${epii / 2}`)

        if ((pi === epi && pii === epii) || (pi === epii && pii === epi)) {
          // console.log('  EXISTS')

          return true
        }
      }

      for (let ei = 0; ei < meshEdges.length; ei += MESH_EDGE_DATA_LENGTH) {
        const epi = meshEdges[ei]
        const epii = meshEdges[ei + 1]

        // console.log(`${pi / 2}->${pii / 2}:${epi / 2}->${epii / 2}`)

        if ((pi === epi && pii === epii) || (pi === epii && pii === epi)) {
          // console.log('  EXISTS')

          return true
        }
      }

      return false
    }

    const doesIntersectEdge = (p0: number, p1: number): boolean => {
      const x0 = points[p0]
      const y0 = points[p0 + 1]
      const x1 = points[p1]
      const y1 = points[p1 + 1]

      for (let i = 0; i < edges.length; i += EDGE_DATA_LENGTH) {
        const p2 = edges[i]
        const p3 = edges[i + 1]

        if (p0 !== p2 && p0 !== p3 && p1 !== p2 && p1 !== p3 &&
        isIntersecting(x0, y0, x1, y1, points[p2], points[p2 + 1], points[p3], points[p3 + 1])
        ) {
          return true
        }
      }

      return false
    }

    const isMiddleOutsideLoop = (p0: number, p1: number) => {
      return !this.isPointInsideLoops(
        (points[p0] + points[p1]) * 0.5,
        (points[p0 + 1] + points[p1 + 1]) * 0.5
      )
    }

    const maxEdgeLen1 = dist * dist * 32
    const maxEdgeLen2 = dist * dist * 16

    for (let pi = 0; pi < pointsLength; pi += POINT_DATA_LENGTH) {
      for (let pii = 0; pii < pointsLength; pii += POINT_DATA_LENGTH) {
        if (pi === pii) {
          continue
        }

        if (len2(points[pi], points[pi + 1], points[pii], points[pii + 1]) > maxEdgeLen1) {
          continue
        }

        if (doesEdgeExists(pi, pii)) {
          continue
        }

        if (doesIntersectEdge(pi, pii)) {
          continue
        }

        if (isMiddleOutsideLoop(pi, pii)) {
          continue
        }

        if (isAnyPointNearbyEdge(points, pi, pii, 1)) {
          continue
        }

        meshEdges.push(pi, pii)
      }

      for (let pii = pointsLength; pii < points.length; pii += POINT_DATA_LENGTH) {
        if (len2(points[pi], points[pi + 1], points[pii], points[pii + 1]) > maxEdgeLen2) {
          continue
        }

        if (doesIntersectEdge(pi, pii)) {
          continue
        }

        meshEdges.push(pi, pii)
      }
    }

    const discardLongerMeshEdges = (flatEdgeIndex: number, /* out */discardedEdgeIndexes: number[]): number | null => {
      discardedEdgeIndexes.length = 0

      const pi0 = meshEdges[flatEdgeIndex]
      const pi1 = meshEdges[flatEdgeIndex + 1]
      const x0 = points[pi0]
      const y0 = points[pi0 + 1]
      const x1 = points[pi1]
      const y1 = points[pi1 + 1]
      const len = len2(x0, y0, x1, y1)

      // console.log(`BEGIN: ${pi0 / 2}->${pi1 / 2}`)

      for (let i = 0; i < meshEdges.length; i += MESH_EDGE_DATA_LENGTH) {
        const i0 = meshEdges[i]
        const i1 = meshEdges[i + 1]
        const tx0 = points[i0]
        const ty0 = points[i0 + 1]
        const tx1 = points[i1]
        const ty1 = points[i1 + 1]

        if (pi0 === i0 || pi0 === i1 || pi1 === i0 || pi1 === i1) {
          continue
        }

        // console.log(`  CHECK ${i0 / 2}->${i1 / 2}`)

        if (isIntersecting(x0, y0, x1, y1, tx0, ty0, tx1, ty1)) {
          // console.log(`    INTER ${pi0 / 2}->${pi1 / 2} vs ${i0 / 2}->${i1 / 2}`)

          if (len2(tx0, ty0, tx1, ty1) < len) {
            // Is not shorter
            // console.log('  DISCARD SOURCE')

            return i
          }

          // Is shorter
          discardedEdgeIndexes.push(i)
        }
      }

      // console.log('  DISCARD COMPARANTS')

      return null
    }

    // Discard phase
    const tempNumbers: number[] = []

    for (let mei = 0, len = meshEdges.length; mei < len;) {
      const shorterEdgeIndex = discardLongerMeshEdges(mei, tempNumbers)

      if (shorterEdgeIndex !== null) {
        const t0 = meshEdges[mei]
        const t1 = meshEdges[mei + 1]

        meshEdges[mei] = meshEdges[shorterEdgeIndex]
        meshEdges[mei + 1] = meshEdges[shorterEdgeIndex + 1]
        meshEdges[shorterEdgeIndex] = t0
        meshEdges[shorterEdgeIndex + 1] = t1

        continue
      }

      if (tempNumbers.length > 0) {
        // console.log('LONGER EDGES', `${indices[i] / 2} -> ${indices[i + 1] / 2}`, tempNumbers.map((i) => `${indices[i] / 2} -> ${indices[i + 1] / 2}`))
        discardEdges(meshEdges, tempNumbers)
        len -= EDGE_DATA_LENGTH * tempNumbers.length
      }

      mei += EDGE_DATA_LENGTH
    }
  }

  findIntersectionWithEdge(x: number, y: number, basePointIndex: number): {point: Point, index: number} | null {
    const bpi = toFlatPtIndex(basePointIndex)
    const points = this.pointsFlatArray
    const edges = this.edgesFlatArray

    const x0 = points[bpi]
    const y0 = points[bpi + 1]

    const flatEdgeIndexes: number[] = []
    const intersectPoints: Point[] = []

    // Collect edge intersections
    for (let i = 0; i < edges.length; i += EDGE_DATA_LENGTH) {
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
        index: toEdgeIndex(flatEdgeIndexes[0]),
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
      index: toEdgeIndex(flatEdgeIndexes[minI]),
      point: intersectPoints[minI],
    }
  }

  findIntersectionWithLoop(x: number, y: number, basePointIndex: number): {point: Point, index: number} | null {
    if (this.numLoopPoints < 3) {
      return null
    }

    const bpi = toFlatPtIndex(basePointIndex)
    const points = this.pointsFlatArray

    let xEdgeIndex = 0
    let xPoint: Point | null = null
    let distToX = Number.POSITIVE_INFINITY

    const bx = points[bpi]
    const by = points[bpi + 1]

    for (let li = 0; li < this._loopLength.length; li++) {
      const loopStart = li === 0 ? 0 : this._loopLength[li - 1]
      const loopEnd = this._loopLength[li]

      let prevPtIndex = loopEnd - POINT_DATA_LENGTH
      let lp0x = points[prevPtIndex]
      let lp0y = points[prevPtIndex + 1]

      // Collect loop intersections
      for (let ptIndex = loopStart; ptIndex < loopEnd; ptIndex += POINT_DATA_LENGTH) {
        const lp1x = points[ptIndex]
        const lp1y = points[ptIndex + 1]

        if (ptIndex !== bpi && prevPtIndex !== bpi) {
          const pt = getSegmentIntersectionPoint(bx, by, x, y, lp0x, lp0y, lp1x, lp1y)

          if (pt !== null) {
            const ixLen = len2(bx, by, pt[0], pt[1])

            if (ixLen < distToX) {
              xEdgeIndex = prevPtIndex
              distToX = ixLen
              xPoint = pt
            }
          }
        }

        prevPtIndex = ptIndex
        lp0x = lp1x
        lp0y = lp1y
      }
    }

    if (xPoint === null) {
      return null
    }

    return {
      index: toEdgeIndex(xEdgeIndex),
      point: xPoint,
    }
  }

  doesPointBelongToEdge(edgeIndex: number, pointIndex: number): boolean {
    const edges = this.edgesFlatArray
    const ei = toFlatEdgeIndex(edgeIndex)
    const pi = toFlatPtIndex(pointIndex)

    return pi === edges[ei] || pi === edges[ei + 1]
  }

  isAnyPointNearbyEdge(basePointIndex: number, targetPointIndex: number, dist = 8): boolean {
    return isAnyPointNearbyEdge(this.pointsFlatArray, toFlatPtIndex(basePointIndex), toFlatPtIndex(targetPointIndex), dist)
  }

  isAnyPointNearbyNewEdge(tx: number, ty: number, basePointIndex: number, dist = 8): boolean {
    return isAnyPointNearbyNewEdge(this.pointsFlatArray, tx, ty, toFlatPtIndex(basePointIndex), dist)
  }

  findPointNearbyOnEdge(x: number, y: number, edgeIndex: number, dist = 8): number | null {
    const points = this.pointsFlatArray
    const edges = this.edgesFlatArray
    const ei = toFlatEdgeIndex(edgeIndex)
    const pi0 = edges[ei]
    const pi1 = edges[ei + 1]
    const dist2 = dist * dist

    if (len2(x, y, points[pi0], points[pi0 + 1]) < dist2) {
      return toPtIndex(pi0)
    }

    if (len2(x, y, points[pi1], points[pi1 + 1]) < dist2) {
      return toPtIndex(pi1)
    }

    return null
  }

  findPointNearbyOnLoop(x: number, y: number, loopPointIndex: number, dist = 8): number | null {
    const points = this.pointsFlatArray
    const pi0 = toFlatPtIndex(loopPointIndex)
    const pi1 = this.wrapLoopIndex(pi0, POINT_DATA_LENGTH)
    const dist2 = dist * dist

    if (len2(x, y, points[pi0], points[pi0 + 1]) < dist2) {
      return toPtIndex(pi0)
    }

    if (len2(x, y, points[pi1], points[pi1 + 1]) < dist2) {
      return toPtIndex(pi1)
    }

    return null
  }

  findPointNearby(x: number, y: number, dist = 8): number | null {
    const points = this.pointsFlatArray

    return toMaybePtIndex(findPointNearby(x, y, points, dist, 0, points.length))
  }

  findEdgePointNearby(x: number, y: number, dist = 8): number | null {
    const points = this.pointsFlatArray
    const firstPointAfterLoops = this._loopLength[this._loopLength.length - 1]

    return toMaybePtIndex(findPointNearby(x, y, points, dist, firstPointAfterLoops, points.length))
  }

  private getLoopIndex(flatPointIndex: number): number {
    for (let i = 0; i < this._loopLength.length; i++) {
      if (flatPointIndex < this._loopLength[i]) {
        return i
      }
    }

    throw new Error(`getLoopIndex: pointIndex:${toPtIndex(flatPointIndex)}, numLoopPoints:${this.numLoopPoints}`)
  }

  private wrapLoopIndex(flatBaseIndex: number, offset: number): number {
    const li = this.getLoopIndex(flatBaseIndex)
    const loopStart = li === 0 ? 0 : this._loopLength[li - 1]
    const loopEnd = this._loopLength[li]
    const loopDiff = loopEnd - loopStart

    return (flatBaseIndex - loopStart + offset + loopDiff) % loopDiff + loopStart
  }

  projToLoop(x: number, y: number, afterLoopPointIndex: number): Point {
    if (afterLoopPointIndex >= this.numLoopPoints) {
      throw new Error(`projToLoop: after:${afterLoopPointIndex}, numLoopPoints:${this.numLoopPoints}`)
    }

    const points = this._points
    const pi = toFlatPtIndex(afterLoopPointIndex)
    const pii = this.wrapLoopIndex(pi, POINT_DATA_LENGTH)

    return projToLine(x, y, points[pi], points[pi + 1], points[pii], points[pii + 1])
  }

  projToEdge(x: number, y: number, edgeIndex: number): Point {
    const points: readonly number[] = this._points
    const edges: readonly number[] = this._edges
    const ei = toFlatEdgeIndex(edgeIndex)
    const epi0 = edges[ei]
    const epi1 = edges[ei + 1]

    return projToLine(x, y, points[epi0], points[epi0] + 1, points[epi1], points[epi1] + 1)
  }

  insertPointIntoLoop(x: number, y: number, afterPointIndex: number): number {
    if (this.numLoopPoints <= 2 || afterPointIndex >= this.numLoopPoints) {
      throw new Error(`insertPointIntoLoop: afterPoint:${afterPointIndex}, numLoopPoints:${this.numLoopPoints}`)
    }

    const pi = toFlatPtIndex(afterPointIndex)
    const xpi = pi + POINT_DATA_LENGTH

    this._points.splice(xpi, 0, x, y)

    // Fix loops lengthes
    for (let li = this.getLoopIndex(pi); li < this._loopLength.length; li++) {
      this._loopLength[li] += POINT_DATA_LENGTH
    }

    // Fix edge indexes
    const edges = this._edges

    for (let i = 0; i < edges.length; i++) {
      if (edges[i] > pi) {
        edges[i] += POINT_DATA_LENGTH
      }
    }

    return toPtIndex(xpi)
  }

  insertPointIntoEdge(x: number, y: number, edgeIndex: number): number {
    const ei = toFlatEdgeIndex(edgeIndex)
    const epi0 = this._edges[ei]
    const epi1 = this._edges[ei + 1]
    const epi2 = this._points.length

    this._points.push(x, y)
    this._edges.splice(ei, EDGE_DATA_LENGTH, epi0, epi2, epi2, epi1)

    return toPtIndex(epi2)
  }

  addEdge(p0: number, p1: number) {
    this._edges.push(toFlatPtIndex(p0), toFlatPtIndex(p1))
  }

  beginInnerLoop() {
    if (this.numPoints > this.numLoopPoints) {
      throw new Error(`beginInnerLoop: numPoints:${this.numPoints}, numLoopPoints:${this.numLoopPoints}`)
    }

    if (this.numLastLoopPoints < 3) {
      throw new Error(`beginInnerLoop: numLastLoopPoints:${this.numLastLoopPoints}, numLoopPoints:${this.numLoopPoints}`)
    }

    this._loopLength.push(this._loopLength[this._loopLength.length - 1])
  }

  addLoopPoint(x: number, y: number): number {
    if (this.numPoints > this.numLoopPoints) {
      throw new Error(`addLoopPoint: numPoints:${this.numPoints}, numLoopPoints:${this.numLoopPoints}`)
    }

    this._points.push(x, y)
    this._loopLength[this._loopLength.length - 1] += POINT_DATA_LENGTH

    return this.numPoints - 1
  }

  addEdgePoint(x: number, y: number): number {
    this._points.push(x, y)

    return this.numPoints - 1
  }

  updatePointPosition(pointIndex: number, x: number, y: number) {
    if (pointIndex < 0 || pointIndex >= this.numPoints) {
      throw new Error(`updateLoopPointPosition: pointIndex:${pointIndex}, numPoints:${this.numPoints}`)
    }

    const pi = toFlatPtIndex(pointIndex)

    this._points[pi] = x
    this._points[pi + 1] = y
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

    if (typeof loopLength === 'number') {
      this._loopLength = [loopLength]
    } else {
      this._loopLength = loopLength
    }

    this.clearCloud()
  }
}
