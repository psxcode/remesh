/* eslint-disable sort-vars */
/* eslint-disable no-param-reassign */
/* eslint-disable max-params */
import { distToSegment2, isIntersecting, isPointInSegmentABBB, len2, projToLine } from './utils'

type PointsData = number[]
type cPointsData = readonly number[]
type EdgesData = number[]
type cEdgesData = readonly number[]
type Point = [number, number]
type WalkDir = -1 | 1
type XPoint = {
  /* Intersection Point X */
  x: number,
  /* Intersection Point Y */
  y: number,
  /* Index of the segment which gave the intersection */
  si: number,
  /* Squared Distance to the intersection */
  d2: number,
}

export class LoopState {
  static getSegmentIntersectionPoint(a0x: number, a0y: number, a1x: number, a1y: number, b0x: number, b0y: number, b1x: number, b1y: number): Point | null {
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

  private _points: PointsData = []
  private _loopLengthes: number[] = [0]
  private _edges: EdgesData = []

  static readonly POINT_DATA_LENGTH = 2
  static readonly EDGE_DATA_LENGTH = 2

  private static printPoint(ptIndex: number) {
    return `pt: ${ptIndex}`
  }

  private static printLoopEdge(ls: LoopState, ptIndex: number) {
    return `${ptIndex}->${LoopState.toPtIndex(ls.wrapLoopIndex(LoopState.toFlatPtIndex(ptIndex), 1))}`
  }

  private static printEdge(ls: LoopState, edgeIndex: number) {
    const ei = LoopState.toFlatEdgeIndex(edgeIndex)
    const edges = ls.edgesFlatArray

    return `edge: ${edgeIndex}, ${LoopState.toPtIndex(edges[ei])}->${(LoopState.toPtIndex(edges[ei + 1]))}`
  }

  private static toFlatPtIndex(ptIndex: number): number {
    return ptIndex * this.POINT_DATA_LENGTH
  }

  private static toPtIndex(flatPtIndex: number): number {
    return flatPtIndex / this.POINT_DATA_LENGTH
  }

  private static toFlatEdgeIndex(edgeIndex: number): number {
    return edgeIndex * this.EDGE_DATA_LENGTH
  }

  private static toLoopEdgeIndex(flatEdgeIndex: number): number {
    return flatEdgeIndex / this.POINT_DATA_LENGTH
  }

  private static toEdgeIndex(flatEdgeIndex: number): number {
    return flatEdgeIndex / this.EDGE_DATA_LENGTH
  }

  private static toMaybePtIndex(flatPtIndex: number | null): number | null {
    return flatPtIndex !== null ? flatPtIndex / this.POINT_DATA_LENGTH : null
  }

  private isPointInsideLoop(x: number, y: number, loopIndex: number): boolean {
    const points = this._points
    const loopBegin = loopIndex === 0 ? 0 : this._loopLengthes[loopIndex - 1]
    const loopEnd = this._loopLengthes[loopIndex]
    let x0 = points[loopEnd - LoopState.POINT_DATA_LENGTH]
    let y0 = points[loopEnd - LoopState.POINT_DATA_LENGTH + 1]
    let x1
    let y1
    let inside = false

    for (let i = loopBegin; i < loopEnd; i += LoopState.POINT_DATA_LENGTH) {
      x1 = points[i]
      y1 = points[i + 1]

      if (((y1 > y) !== (y0 > y)) && (x < (x0 - x1) * (y - y1) / (y0 - y1) + x1)) {
        inside = !inside
      }

      x0 = x1
      y0 = y1
    }

    return (loopIndex === 0) === inside
  }

  private findPointNearbyCoords(x: number, y: number, dist: number, flatFrom: number, flatTo: number): number | null {
    const points = this._points
    const dist2 = dist * dist

    for (let i = flatFrom; i < flatTo; i += LoopState.POINT_DATA_LENGTH) {
      if (len2(x, y, points[i], points[i + 1]) < dist2) {
        return i
      }
    }

    return null
  }

  get loopLengthes(): readonly number[] {
    return this._loopLengthes
  }

  get numLoops() {
    return this._loopLengthes.length
  }

  get numLoopPoints() {
    return LoopState.toPtIndex(this._loopLengthes[this._loopLengthes.length - 1])
  }

  private get numLastLoopPoints() {
    const loopStart = this._loopLengthes.length <= 1 ? 0 : this._loopLengthes[this._loopLengthes.length - 2]
    const loopEnd = this._loopLengthes[this._loopLengthes.length - 1]

    return LoopState.toPtIndex(loopEnd - loopStart)
  }

  get numPoints() {
    return LoopState.toPtIndex(this._points.length)
  }

  get numEdges() {
    return this._edges.length / LoopState.EDGE_DATA_LENGTH
  }

  get pointsFlatArray(): cPointsData {
    return this._points
  }

  get edgesFlatArray(): cEdgesData {
    return this._edges
  }

  getLoopDataBegin(loopIndex: number): number {
    return (loopIndex > 0 && loopIndex < this._loopLengthes.length)
      ? this._loopLengthes[loopIndex - 1]
      : 0
    }

  getLoopDataEnd(loopIndex: number): number {
    return (loopIndex >= 0 && loopIndex < this._loopLengthes.length)
      ? this._loopLengthes[loopIndex]
      : 0
  }

  clear() {
    this.clearEdges()
    this._points.length = 0
    this._loopLengthes = [0]
  }

  clearEdges() {
    this._edges.length = 0
    // Trim points to the loop
    this._points.length = this._loopLengthes[this._loopLengthes.length - 1]
  }

  clearLastLoop() {
    this.clearEdges()

    this._loopLengthes.length -= 1

    if (this._loopLengthes.length === 0) {
      this._loopLengthes.push(0)
    }

    this._points.length = this._loopLengthes[this._loopLengthes.length - 1]
  }

  private isNewEdgeMiddleInsideAllLoops(x: number, y: number, basePointIndex: number): boolean {
    const points = this._points
    const flatPi = LoopState.toFlatPtIndex(basePointIndex)
    const px = (x + points[flatPi]) / 2
    const py = (y + points[flatPi + 1]) / 2

    return this.isPointInsideAllLoops(px, py)
  }

  private isEdgeMiddleInsideAllLoops(pi0: number, pi1: number): boolean {
    const points = this._points
    const flPi0 = LoopState.toFlatPtIndex(pi0)
    const flPi1 = LoopState.toFlatPtIndex(pi1)

    const px = (points[flPi0] + points[flPi1]) / 2
    const py = (points[flPi0 + 1] + points[flPi1 + 1]) / 2

    return this.isPointInsideAllLoops(px, py)
  }

  isPointInsideAllLoops(x: number, y: number): boolean {
    for (let li = 0; li < this._loopLengthes.length; li++) {
      if (!this.isPointInsideLoop(x, y, li)) {
        return false
      }
    }

    return true
  }

  findLoopEdgeNearby(x: number, y: number, dist: number): number | null {
    if (this.numLoopPoints < 3) {
      return null
    }

    const dist2 = dist * dist

    for (let li = 0 ; li < this._loopLengthes.length; li++) {
      const loopBegin = li === 0 ? 0 : this._loopLengthes[li - 1]
      const loopEnd = this._loopLengthes[li]
      const points = this._points
      let prevI = loopEnd - LoopState.POINT_DATA_LENGTH
      let lp0x = points[prevI]
      let lp0y = points[prevI + 1]

      for (let i = loopBegin; i < loopEnd; i += LoopState.POINT_DATA_LENGTH) {
        const lp1x = points[i]
        const lp1y = points[i + 1]

        if (dist2 > distToSegment2(x, y, lp0x, lp0y, lp1x, lp1y)) {
          return LoopState.toLoopEdgeIndex(prevI)
        }

        prevI = i
        lp0x = lp1x
        lp0y = lp1y
      }
    }

    return null
  }

  findEdgeNearby(x: number, y: number, dist: number): number | null {
    const points = this.pointsFlatArray
    const edges = this.edgesFlatArray
    const dist2 = dist * dist

    for (let ei = 0; ei < edges.length; ei += LoopState.EDGE_DATA_LENGTH) {
      if (dist2 > distToSegment2(x, y, points[edges[ei]], points[edges[ei] + 1], points[edges[ei + 1]], points[edges[ei + 1] + 1])) {
        return LoopState.toEdgeIndex(ei)
      }
    }

    return null
  }

  private isExistingEdge(pi0: number, pi1: number): boolean {
    const edges = this.edgesFlatArray

    const p0 = LoopState.toFlatPtIndex(pi0)
    const p1 = LoopState.toFlatPtIndex(pi1)

    for (let i = 0; i < edges.length; i += LoopState.EDGE_DATA_LENGTH) {
      const ei0 = edges[i]
      const ei1 = edges[i + 1]

      if ((p0 === ei0 && p1 === ei1) || (p0 === ei1 && p1 === ei0)) {
        return true
      }
    }

    return false
  }

  private isExistingLoopEdge(pi0: number, pi1: number): boolean {
    const numLoopPoints = this.numLoopPoints

    return pi0 < numLoopPoints && pi1 < numLoopPoints &&
     ((pi0 + 1) % numLoopPoints === pi1 || (pi1 + 1) % numLoopPoints === pi0)
  }

  private doesNewLoopEdgeIntersectOtherLoops(x: number, y: number, basePointIndex: number): boolean {
    const points = this.pointsFlatArray
    const bpi = LoopState.toFlatPtIndex(basePointIndex)
    const x0 = points[bpi]
    const y0 = points[bpi + 1]

    for (let li = 0; li < this._loopLengthes.length - 1; li++) {
      const loopStart = li === 0 ? 0 : this._loopLengthes[li - 1]
      const loopEnd = this._loopLengthes[li]

      let pii = loopEnd - LoopState.POINT_DATA_LENGTH

      for (let pi = loopStart; pi < loopEnd; pi += LoopState.POINT_DATA_LENGTH) {
        if (pi !== bpi && pii !== bpi &&
        isIntersecting(x0, y0, x, y, points[pi], points[pi + 1], points[pii], points[pii + 1])) {
          return true
        }

        pii = pi
      }
    }

    return false
  }

  private findIntersectionWithEdge(x: number, y: number, basePointIndex: number): XPoint | null {
    const bpi = LoopState.toFlatPtIndex(basePointIndex)
    const points = this.pointsFlatArray
    const edges = this.edgesFlatArray

    const x0 = points[bpi]
    const y0 = points[bpi + 1]

    let xPt: Point | null = null
    let distToX = Number.POSITIVE_INFINITY
    let xEdgeIndex: number

    // Collect edge intersections
    for (let i = 0; i < edges.length; i += LoopState.EDGE_DATA_LENGTH) {
      const pi0 = edges[i]
      const pi1 = edges[i + 1]

      if (pi0 === bpi || pi1 === bpi) {
        continue
      }

      const pt = LoopState.getSegmentIntersectionPoint(x0, y0, x, y, points[pi0], points[pi0 + 1], points[pi1], points[pi1 + 1])

      if (pt !== null) {
        const l = len2(x0, y0, pt[0], pt[1])

        if (l < distToX) {
          xPt = pt
          distToX = l
          xEdgeIndex = i
        }
      }
    }

    if (xPt === null) {
      return null
    }

    return {
      si: LoopState.toEdgeIndex(xEdgeIndex!),
      x: xPt[0],
      y: xPt[1],
      d2: distToX,
    }
  }

  private findLineIntersectionWithLoopIndex(x0: number, y0: number, x1: number, y1: number, loopIndex: number, skipPointIndex: number | null = null): XPoint | null {
    if (this.numLoopPoints < 3) {
      return null
    }

    const points = this.pointsFlatArray

    let xEdgeIndex = 0
    let xPoint: Point | null = null
    let distToX = Number.POSITIVE_INFINITY

    const loopStart = loopIndex === 0 ? 0 : this._loopLengthes[loopIndex - 1]
    const loopEnd = this._loopLengthes[loopIndex]

      let prevPtIndex = loopEnd - LoopState.POINT_DATA_LENGTH
      let lp0x = points[prevPtIndex]
      let lp0y = points[prevPtIndex + 1]

      // Collect loop intersections
      for (let ptIndex = loopStart; ptIndex < loopEnd; ptIndex += LoopState.POINT_DATA_LENGTH) {
        const lp1x = points[ptIndex]
        const lp1y = points[ptIndex + 1]

      if (ptIndex !== skipPointIndex && prevPtIndex !== skipPointIndex) {
        const pt = LoopState.getSegmentIntersectionPoint(x0, y0, x1, y1, lp0x, lp0y, lp1x, lp1y)

          if (pt !== null) {
          const ixLen = len2(x0, y0, pt[0], pt[1])

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

    if (xPoint === null) {
      return null
    }

    return {
      si: LoopState.toLoopEdgeIndex(xEdgeIndex),
      x: xPoint[0],
      y: xPoint[1],
      d2: distToX,
    }
  }

  private findClosestIntersectionWithAllLoops(x: number, y: number, basePointIndex: number): XPoint | null {
    if (this.numLoopPoints < 3) {
      return null
    }

    const bpi = LoopState.toFlatPtIndex(basePointIndex)
    const points = this.pointsFlatArray

    let xPoint: XPoint | null = null

    const bx = points[bpi]
    const by = points[bpi + 1]

    for (let li = 0; li < this._loopLengthes.length; li++) {
      const xRes = this.findLineIntersectionWithLoopIndex(bx, by, x, y, li, bpi)

      if (xRes !== null && (xPoint === null || xRes.d2 < xPoint.d2)) {
        xPoint = xRes
      }
    }

    return xPoint
  }

  private doesPointBelongToEdge(edgeIndex: number, pointIndex: number): boolean {
    const edges = this.edgesFlatArray
    const ei = LoopState.toFlatEdgeIndex(edgeIndex)
    const pi = LoopState.toFlatPtIndex(pointIndex)

    return pi === edges[ei] || pi === edges[ei + 1]
  }

  private isAnyPointNearbyEdge(basePointIndex: number, targetPointIndex: number, dist: number): boolean {
    const points = this._points
    const dist2 = dist * dist
    const flatBpi = LoopState.toFlatPtIndex(basePointIndex)
    const flatTpi = LoopState.toFlatPtIndex(targetPointIndex)
    const bx = points[flatBpi]
    const by = points[flatBpi + 1]
    const tx = points[flatTpi]
    const ty = points[flatTpi + 1]

    // console.log(`${bpi / 2}->${tpi / 2}`)

    for (let i = 0; i < points.length; i += LoopState.POINT_DATA_LENGTH) {
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

  private isAnyPointNearbyNewEdge(tx: number, ty: number, basePointIndex: number, dist: number): boolean {
    const points = this._points
    const dist2 = dist * dist
    const flBpi = LoopState.toFlatPtIndex(basePointIndex)
    const bx = points[flBpi]
    const by = points[flBpi + 1]

    for (let i = 0; i < points.length; i += LoopState.POINT_DATA_LENGTH) {
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

  private findPointNearbyOnEdge(x: number, y: number, edgeIndex: number, dist: number): number | null {
    const points = this.pointsFlatArray
    const edges = this.edgesFlatArray
    const ei = LoopState.toFlatEdgeIndex(edgeIndex)
    const pi0 = edges[ei]
    const pi1 = edges[ei + 1]
    const dist2 = dist * dist

    if (len2(x, y, points[pi0], points[pi0 + 1]) < dist2) {
      return LoopState.toPtIndex(pi0)
    }

    if (len2(x, y, points[pi1], points[pi1 + 1]) < dist2) {
      return LoopState.toPtIndex(pi1)
    }

    return null
  }

  private findPointNearbyOnLoop(x: number, y: number, loopPointIndex: number, dist = 8): number | null {
    const points = this.pointsFlatArray
    const pi0 = LoopState.toFlatPtIndex(loopPointIndex)
    const pi1 = this.wrapLoopIndex(pi0, 1)
    const dist2 = dist * dist

    if (len2(x, y, points[pi0], points[pi0 + 1]) < dist2) {
      return LoopState.toPtIndex(pi0)
    }

    if (len2(x, y, points[pi1], points[pi1 + 1]) < dist2) {
      return LoopState.toPtIndex(pi1)
    }

    return null
  }

  findPointNearby(x: number, y: number, dist: number): number | null {
    return LoopState.toMaybePtIndex(this.findPointNearbyCoords(x, y, dist, 0, this._points.length))
  }

  findEdgePointNearby(x: number, y: number, dist: number): number | null {
    return LoopState.toMaybePtIndex(this.findPointNearbyCoords(x, y, dist, this._loopLengthes[this._loopLengthes.length - 1], this._points.length))
  }

  private getLoopIndex(flatPointIndex: number): number {
    for (let i = 0; i < this._loopLengthes.length; i++) {
      if (flatPointIndex < this._loopLengthes[i]) {
        return i
      }
    }

    throw new Error(`getLoopIndex: pointIndex:${LoopState.toPtIndex(flatPointIndex)}, numLoopPoints:${this.numLoopPoints}`)
  }

  private wrapLoopIndex(flatBaseIndex: number, numPointsIncrement: number): number {
    const li = this.getLoopIndex(flatBaseIndex)
    const loopStart = li === 0 ? 0 : this._loopLengthes[li - 1]
    const loopEnd = this._loopLengthes[li]
    const loopDiff = loopEnd - loopStart

    return (flatBaseIndex - loopStart + numPointsIncrement * LoopState.POINT_DATA_LENGTH + loopDiff) % loopDiff + loopStart
  }

  projToLoop(x: number, y: number, afterLoopPointIndex: number): Point {
    if (afterLoopPointIndex >= this.numLoopPoints) {
      throw new Error(`projToLoop: after:${afterLoopPointIndex}, numLoopPoints:${this.numLoopPoints}`)
    }

    const points = this._points
    const pi = LoopState.toFlatPtIndex(afterLoopPointIndex)
    const pii = this.wrapLoopIndex(pi, 1)

    return projToLine(x, y, points[pi], points[pi + 1], points[pii], points[pii + 1])
  }

  projToEdge(x: number, y: number, edgeIndex: number): Point {
    const points: readonly number[] = this._points
    const edges: readonly number[] = this._edges
    const ei = LoopState.toFlatEdgeIndex(edgeIndex)
    const epi0 = edges[ei]
    const epi1 = edges[ei + 1]

    return projToLine(x, y, points[epi0], points[epi0] + 1, points[epi1], points[epi1] + 1)
  }

  private insertPointIntoLoop(x: number, y: number, afterPointIndex: number): number {
    if (this.numLoopPoints <= 2 || afterPointIndex >= this.numLoopPoints) {
      throw new Error(`insertPointIntoLoop: afterPoint:${afterPointIndex}, numLoopPoints:${this.numLoopPoints}`)
    }

    const pi = LoopState.toFlatPtIndex(afterPointIndex)
    const xpi = pi + LoopState.POINT_DATA_LENGTH

    this._points.splice(xpi, 0, x, y)

    // Fix loops lengthes
    for (let li = this.getLoopIndex(pi); li < this._loopLengthes.length; li++) {
      this._loopLengthes[li] += LoopState.POINT_DATA_LENGTH
    }

    // Fix edge indexes
    const edges = this._edges

    for (let i = 0; i < edges.length; i++) {
      if (edges[i] > pi) {
        edges[i] += LoopState.POINT_DATA_LENGTH
      }
    }

    return LoopState.toPtIndex(xpi)
  }

  private insertPointIntoEdge(x: number, y: number, edgeIndex: number): number {
    const ei = LoopState.toFlatEdgeIndex(edgeIndex)
    const epi0 = this._edges[ei]
    const epi1 = this._edges[ei + 1]
    const epi2 = this._points.length

    this._points.push(x, y)
    this._edges.splice(ei, LoopState.EDGE_DATA_LENGTH, epi0, epi2, epi2, epi1)

    return LoopState.toPtIndex(epi2)
  }

  getAABB(): [number, number, number, number] {
    const points = this._points
    const flatTo = this._loopLengthes[0]
    let minX = points[0]
    let minY = points[1]
    let maxX = minX
    let maxY = minY

    for (let i = LoopState.POINT_DATA_LENGTH; i < flatTo; i += LoopState.POINT_DATA_LENGTH) {
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

  private addEdge(p0: number, p1: number) {
    this._edges.push(LoopState.toFlatPtIndex(p0), LoopState.toFlatPtIndex(p1))
  }

  beginInnerLoop() {
    if (this.numLastLoopPoints < 3) {
      this.clearLastLoop()
    }

    this.clearEdges()
    this._loopLengthes.push(this._loopLengthes[this._loopLengthes.length - 1])
    }

  endInnerLoop() {
    if (this.numLastLoopPoints < 3) {
      this.clearLastLoop()

      return
    }

    // Check last loops does not contain any loops
    const lastLoopIndex = this.numLoops - 1
    const pts = this.pointsFlatArray

    for (let i = 1; i < this.numLoops - 1;++i) {
      const loopBegin = this._loopLengthes[i - 1]
      const loopEnd = this._loopLengthes[i]

      for (let pi = loopBegin; pi < loopEnd; pi += LoopState.POINT_DATA_LENGTH) {
        // If any point is outside the loop
        if (!this.isPointInsideLoop(pts[pi], pts[pi + 1], lastLoopIndex)) {
          // Bad last loop
          this.clearLastLoop()

          return
        }
      }
    }
  }

  addLoopPoint(x: number, y: number, basePointIndex: number | null, snapDist: number): number | null {
    const pin = this.findPointNearby(x, y, snapDist)

    if (pin !== null) {
      return null
    }

    const isInnerLoop = this.numLoops > 1

    if (isInnerLoop) {
      if (!this.isPointInsideAllLoops(x, y)) {
        // console.log('OUTSIDE')

        return null
      }

      if (basePointIndex !== null && this.doesNewLoopEdgeIntersectOtherLoops(x, y, basePointIndex)) {
        // console.log('INTERSECT')

        return null
      }
    }

    if (this.numPoints > this.numLoopPoints) {
      throw new Error(`addLoopPoint: numPoints:${this.numPoints}, numLoopPoints:${this.numLoopPoints}`)
    }

    this._points.push(x, y)
    this._loopLengthes[this._loopLengthes.length - 1] += LoopState.POINT_DATA_LENGTH

    return this.numPoints - 1
  }

  private isBadNewEdge(x: number, y: number, basePointIndex: number, snapDist: number): boolean {
    return this.isAnyPointNearbyNewEdge(x, y, basePointIndex, snapDist)
     || !this.isNewEdgeMiddleInsideAllLoops(x, y, basePointIndex)
  }

  private isBadEdge(pi0: number, pi1: number, snapDist: number): boolean {
    return pi0 === pi1 ||
      this.isExistingEdge(pi0, pi1) ||
      this.isExistingLoopEdge(pi0, pi1) ||
      this.isAnyPointNearbyEdge(pi0, pi1, snapDist) ||
      !this.isEdgeMiddleInsideAllLoops(pi0, pi1)
  }

  addConstraintPoint(x: number, y: number, basePointIndex: number | null, snapDist: number): number | null {
  // If first point
    if (basePointIndex === null) {
    // console.log('FIRST_POINT')

      // Try find point nearby
      {
        const pin = this.findPointNearby(x, y, snapDist)

        if (pin !== null) {
        // console.log('  POINT_NEARBY', printPoint(pin))
          return pin
        }
      }

      // Try to find edge nearby
      {
        const ein = this.findEdgeNearby(x, y, snapDist)

        if (ein !== null) {
        // console.log('  EDGE_NEARBY', printEdge(ein))

          const [px, py] = this.projToEdge(x, y, ein)

          return this.insertPointIntoEdge(px, py, ein)
        }
      }

      // Try to find loop edge nearby
      {
        const ein = this.findLoopEdgeNearby(x, y, snapDist)

        if (ein !== null) {
        // console.log('  LOOP_NEARBY', printLoopEdge(ein))

          const [px, py] = this.projToLoop(x, y, ein)

          return this.insertPointIntoLoop(px, py, ein)
        }
      }

      if (this.isPointInsideAllLoops(x, y)) {
      // console.log('  GOOD_POINT')
        return this.addEdgePoint(x, y)
      }

      // console.log('  OUTSIDE_LOOP')

      return null
    }

    // Not first point
    // Find if intersecting existing constraints
    // console.log('NEXT_POINT')

    {
      const ix = this.findIntersectionWithEdge(x, y, basePointIndex)

      if (ix !== null) {
      // console.log('  EDGE_INTERSECT', printEdge(ix.index))

        const { x: px, y: py, si } = ix
        const pin = this.findPointNearbyOnEdge(px, py, si, snapDist)

        if (pin !== null) {
        // console.log('    POINT_NEARBY', printPoint(pin))

          if (this.isBadEdge(basePointIndex, pin, snapDist)) {
          // console.log('      BAD_EDGE')

            return null
          }

          this.addEdge(basePointIndex, pin)

          return pin
        }

        if (
          this.isAnyPointNearbyNewEdge(px, py, basePointIndex, snapDist)
        ) {
        // console.log('    BAD_EDGE')

          return null
        }

        const npi = this.insertPointIntoEdge(px, py, si)

        this.addEdge(basePointIndex, npi)

        return npi
      }
    }

    // Find if intersecting loop
    {
      const ix = this.findClosestIntersectionWithAllLoops(x, y, basePointIndex)

      if (ix !== null) {
        // console.log('  INTERSECT_LOOP', this.printLoopEdge(ix.index))

        const { x: px, y: py, si } = ix
        const pin = this.findPointNearbyOnLoop(px, py, si, snapDist)

        if (pin !== null) {
          // console.log('    POINT_NEARBY', this.printPoint(pin))

          if (this.isBadEdge(basePointIndex, pin, snapDist)) {
            // console.log('      BAD_EDGE')

            return null
          }

          this.addEdge(basePointIndex, pin)

          return pin
        }

        if (
          this.isBadNewEdge(px, py, basePointIndex, snapDist)
        ) {
          // console.log('    BAD_EDGE')

          return null
        }

        const npi = this.insertPointIntoLoop(px, py, si)

        this.addEdge(
          basePointIndex >= npi ? basePointIndex + 1 : basePointIndex,
          npi
        )

        return npi
      }
    }

    // Find if point is nearby
    {
      const pin = this.findPointNearby(x, y, snapDist)

      if (pin !== null) {
      // console.log('  POINT_NEARBY', printPoint(pin))

        if (this.isBadEdge(basePointIndex, pin, snapDist)) {
        // console.log('    BAD_EDGE')

          return null
        }

        this.addEdge(basePointIndex, pin)

        return pin
      }
    }

    // Find if constraint edge is nearby
    {
      const ein = this.findEdgeNearby(x, y, snapDist)

      if (ein !== null) {
      // console.log('  EDGE_NEARBY', printEdge(ein))

        if (this.doesPointBelongToEdge(ein, basePointIndex)) {
        // console.log('    SAME_EDGE')

          return null
        }

        const [px, py] = this.projToEdge(x, y, ein)
        const pin = this.findPointNearbyOnEdge(px, py, ein, snapDist)

        if (pin !== null) {
        // console.log('    POINT_NEARBY', printPoint(pin))

          if (this.isBadEdge(basePointIndex, pin, snapDist)) {
          // console.log('      BAD_EDGE')

            return null
          }

          this.addEdge(basePointIndex, pin)

          return pin
        }

        if (this.isAnyPointNearbyNewEdge(px, py, basePointIndex, snapDist)) {
        // console.log('    BAD_EDGE')

          return null
        }

        const npi = this.insertPointIntoEdge(px, py, ein)

        this.addEdge(basePointIndex, npi)

        return npi
      }
    }

    // Find if loop edge is nearby
    {
      const ein = this.findLoopEdgeNearby(x, y, snapDist)

      if (ein !== null) {
      // console.log('  LOOP_NEARBY', printLoopEdge(ein))

        const [px, py] = this.projToLoop(x, y, ein)
        const pin = this.findPointNearbyOnLoop(px, py, ein, snapDist)

        if (pin !== null) {
        // console.log('    POINT_NEARBY', printPoint(pin))

          if (this.isBadEdge(basePointIndex, pin, snapDist)) {
            // console.log('      BAD_EDGE')

            return null
          }

          this.addEdge(basePointIndex, pin)

          return pin
        }

        if (this.isAnyPointNearbyNewEdge(px, py, basePointIndex, snapDist)) {
        // console.log('    BAD_EDGE')

          return null
        }

        const npi = this.insertPointIntoLoop(px, py, ein)

        this.addEdge(
          basePointIndex >= npi ? basePointIndex + 1 : basePointIndex,
          npi
        )

        return npi
      }
    }

    // Standalone point
    if (this.isPointInsideAllLoops(x, y)) {
    // console.log('  GOOD_POINT')

      if (this.isAnyPointNearbyNewEdge(x, y, basePointIndex, snapDist)) {
      // console.log('    BAD_EDGE')

        return null
      }

      this.addEdge(basePointIndex, this.numPoints)

      return this.addEdgePoint(x, y)
    }

    // console.log('  OUTSIDE_LOOP')
    return null
  }

  private addEdgePoint(x: number, y: number): number {
    this._points.push(x, y)

    return this.numPoints - 1
  }

  updatePointPosition(pointIndex: number, x: number, y: number) {
    if (pointIndex < 0 || pointIndex >= this.numPoints) {
      throw new Error(`updateLoopPointPosition: pointIndex:${pointIndex}, numPoints:${this.numPoints}`)
    }

    const pi = LoopState.toFlatPtIndex(pointIndex)

    this._points[pi] = x
    this._points[pi + 1] = y
  }

  serialize(): string {
    return JSON.stringify({
      points: this._points,
      edges: this._edges,
      loopLength: this._loopLengthes,
    })
  }

  deserialize(data: string) {
    const { points, edges, loopLength } = JSON.parse(data)

    this._points = points
    this._edges = edges
      this._loopLengthes = loopLength
    //
  }
}
