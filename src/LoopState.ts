/* eslint-disable no-param-reassign */
/* eslint-disable max-params */
import { distToSegment2, getSegmentIntersectionPoint, isIntersecting, isPointInSegmentABBB, len2, projToLine } from './utils'

type PointsData = number[]
type cPointsData = readonly number[]
type EdgesData = number[]
type cEdgesData = readonly number[]
type Point = [number, number]

export class LoopState {
  private _points: PointsData = []
  private _loopLengthes: number[] = [0]
  private _edges: EdgesData = []

  static readonly POINT_DATA_LENGTH = 2
  static readonly EDGE_DATA_LENGTH = 2

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

  private findSpecificLoopEdgeNearby(x: number, y: number, flatLoopStart: number, flatLoopEnd: number, dist: number): number | null {
    const points = this._points
    let prevI = flatLoopEnd - LoopState.POINT_DATA_LENGTH
    let lp0x = points[prevI]
    let lp0y = points[prevI + 1]
    const dist2 = dist * dist

    for (let i = flatLoopStart; i < flatLoopEnd; i += LoopState.POINT_DATA_LENGTH) {
      const lp1x = points[i]
      const lp1y = points[i + 1]

      if (dist2 > distToSegment2(x, y, lp0x, lp0y, lp1x, lp1y)) {
        return prevI
      }

      prevI = i
      lp0x = lp1x
      lp0y = lp1y
    }

    return null
  }

  private isPointInsideLoop(x: number, y: number, flatLoopStart: number, flatLoopEnd: number): boolean {
    const points = this._points
    let x0 = points[flatLoopEnd - LoopState.POINT_DATA_LENGTH]
    let y0 = points[flatLoopEnd - LoopState.POINT_DATA_LENGTH + 1]
    let x1
    let y1
    let inside = false

    for (let i = flatLoopStart; i < flatLoopEnd; i += LoopState.POINT_DATA_LENGTH) {
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

  private _findPointNearby(x: number, y: number, dist: number, flatFrom: number, flatTo: number): number | null {
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

  get numLastLoopPoints() {
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

  getNumLoopPoints(loopIndex: number): number {
    if (loopIndex < 0 || loopIndex >= this._loopLengthes.length) {
      return 0
    }

    return this._loopLengthes[loopIndex]
  }

  clear() {
    this.clearEdges()
    this._points.length = 0
    this._loopLengthes = [0]
  }

  clearEdges() {
    this._edges.length = 0
    this._points.length = this._loopLengthes[this._loopLengthes.length - 1]
  }

  clearLastLoop() {
    this.clearEdges()

    this._loopLengthes.length -= 1
    this._points.length = this._loopLengthes.length === 0 ? 0 : this._loopLengthes[this._loopLengthes.length - 1]
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

    for (let i = 0; i < edges.length; i += LoopState.EDGE_DATA_LENGTH) {
      if (edges[i] === edges[i + 1]) {
        console.error('EDGES_ERROR')
        console.log(edges)
      }
    }
  }

  isPointInsideAllLoops(x: number, y: number): boolean {
    if (!this.isPointInsideLoop(x, y, 0, this._loopLengthes[0])) {
      return false
    }

    for (let i = 1; i < this._loopLengthes.length; i++) {
      // Note inverted test for inner loops
      if (this.isPointInsideLoop(x, y, this._loopLengthes[i - 1], this._loopLengthes[i])) {
        return false
      }
    }

    return true
  }

  isNewLoopPointInsideOtherLoops(x: number, y: number): boolean {
    if (!this.isPointInsideLoop(x, y, 0, this._loopLengthes[0])) {
      return false
    }

    for (let i = 1; i < this._loopLengthes.length - 1; i++) {
      // Note inverted test for inner loops
      if (this.isPointInsideLoop(x, y, this._loopLengthes[i - 1], this._loopLengthes[i])) {
        return false
      }
    }

    return true
  }

  findLoopEdgeNearby(x: number, y: number, dist = 8): number | null {
    if (this.numLoopPoints < 3) {
      return null
    }

    for (let li = 0 ; li < this._loopLengthes.length; li++) {
      const flei = this.findSpecificLoopEdgeNearby(x, y, li === 0 ? 0 : this._loopLengthes[li - 1], this._loopLengthes[li], dist)

      if (flei !== null) {
        return LoopState.toLoopEdgeIndex(flei)
      }
    }

    return null
  }

  findEdgeNearby(x: number, y: number, dist = 8): number | null {
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

  isExistingEdge(pi0: number, pi1: number): boolean {
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

  isExistingLoopEdge(pi0: number, pi1: number): boolean {
    const numLoopPoints = this.numLoopPoints

    return pi0 < numLoopPoints && pi1 < numLoopPoints &&
     ((pi0 + 1) % numLoopPoints === pi1 || (pi1 + 1) % numLoopPoints === pi0)
  }

  doesNewLoopEdgeIntersectOtherLoops(x: number, y: number, basePointIndex: number): boolean {
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

  findIntersectionWithEdge(x: number, y: number, basePointIndex: number): {point: Point, index: number} | null {
    const bpi = LoopState.toFlatPtIndex(basePointIndex)
    const points = this.pointsFlatArray
    const edges = this.edgesFlatArray

    const x0 = points[bpi]
    const y0 = points[bpi + 1]

    const flatEdgeIndexes: number[] = []
    const intersectPoints: Point[] = []

    // Collect edge intersections
    for (let i = 0; i < edges.length; i += LoopState.EDGE_DATA_LENGTH) {
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
        index: LoopState.toEdgeIndex(flatEdgeIndexes[0]),
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
      index: LoopState.toEdgeIndex(flatEdgeIndexes[minI]),
      point: intersectPoints[minI],
    }
  }

  findIntersectionWithLoop(x: number, y: number, basePointIndex: number): {point: Point, index: number} | null {
    if (this.numLoopPoints < 3) {
      return null
    }

    const bpi = LoopState.toFlatPtIndex(basePointIndex)
    const points = this.pointsFlatArray

    let xEdgeIndex = 0
    let xPoint: Point | null = null
    let distToX = Number.POSITIVE_INFINITY

    const bx = points[bpi]
    const by = points[bpi + 1]

    for (let li = 0; li < this._loopLengthes.length; li++) {
      const loopStart = li === 0 ? 0 : this._loopLengthes[li - 1]
      const loopEnd = this._loopLengthes[li]

      let prevPtIndex = loopEnd - LoopState.POINT_DATA_LENGTH
      let lp0x = points[prevPtIndex]
      let lp0y = points[prevPtIndex + 1]

      // Collect loop intersections
      for (let ptIndex = loopStart; ptIndex < loopEnd; ptIndex += LoopState.POINT_DATA_LENGTH) {
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
      index: LoopState.toEdgeIndex(xEdgeIndex),
      point: xPoint,
    }
  }

  doesPointBelongToEdge(edgeIndex: number, pointIndex: number): boolean {
    const edges = this.edgesFlatArray
    const ei = LoopState.toFlatEdgeIndex(edgeIndex)
    const pi = LoopState.toFlatPtIndex(pointIndex)

    return pi === edges[ei] || pi === edges[ei + 1]
  }

  isAnyPointNearbyEdge(basePointIndex: number, targetPointIndex: number, dist = 8): boolean {
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

  isAnyPointNearbyNewEdge(tx: number, ty: number, basePointIndex: number, dist = 8): boolean {
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

  findPointNearbyOnEdge(x: number, y: number, edgeIndex: number, dist = 8): number | null {
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

  findPointNearbyOnLoop(x: number, y: number, loopPointIndex: number, dist = 8): number | null {
    const points = this.pointsFlatArray
    const pi0 = LoopState.toFlatPtIndex(loopPointIndex)
    const pi1 = this.wrapLoopIndex(pi0, LoopState.POINT_DATA_LENGTH)
    const dist2 = dist * dist

    if (len2(x, y, points[pi0], points[pi0 + 1]) < dist2) {
      return LoopState.toPtIndex(pi0)
    }

    if (len2(x, y, points[pi1], points[pi1 + 1]) < dist2) {
      return LoopState.toPtIndex(pi1)
    }

    return null
  }

  findPointNearby(x: number, y: number, dist = 8): number | null {
    return LoopState.toMaybePtIndex(this._findPointNearby(x, y, dist, 0, this._points.length))
  }

  findEdgePointNearby(x: number, y: number, dist = 8): number | null {
    return LoopState.toMaybePtIndex(this._findPointNearby(x, y, dist, this._loopLengthes[this._loopLengthes.length - 1], this._points.length))
  }

  private getLoopIndex(flatPointIndex: number): number {
    for (let i = 0; i < this._loopLengthes.length; i++) {
      if (flatPointIndex < this._loopLengthes[i]) {
        return i
      }
    }

    throw new Error(`getLoopIndex: pointIndex:${LoopState.toPtIndex(flatPointIndex)}, numLoopPoints:${this.numLoopPoints}`)
  }

  private wrapLoopIndex(flatBaseIndex: number, offset: number): number {
    const li = this.getLoopIndex(flatBaseIndex)
    const loopStart = li === 0 ? 0 : this._loopLengthes[li - 1]
    const loopEnd = this._loopLengthes[li]
    const loopDiff = loopEnd - loopStart

    return (flatBaseIndex - loopStart + offset + loopDiff) % loopDiff + loopStart
  }

  projToLoop(x: number, y: number, afterLoopPointIndex: number): Point {
    if (afterLoopPointIndex >= this.numLoopPoints) {
      throw new Error(`projToLoop: after:${afterLoopPointIndex}, numLoopPoints:${this.numLoopPoints}`)
    }

    const points = this._points
    const pi = LoopState.toFlatPtIndex(afterLoopPointIndex)
    const pii = this.wrapLoopIndex(pi, LoopState.POINT_DATA_LENGTH)

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

  insertPointIntoLoop(x: number, y: number, afterPointIndex: number): number {
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

  insertPointIntoEdge(x: number, y: number, edgeIndex: number): number {
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

  addEdge(p0: number, p1: number) {
    this._edges.push(LoopState.toFlatPtIndex(p0), LoopState.toFlatPtIndex(p1))
  }

  beginInnerLoop() {
    if (this.numPoints > this.numLoopPoints) {
      throw new Error(`beginInnerLoop: numPoints:${this.numPoints}, numLoopPoints:${this.numLoopPoints}`)
    }

    if (this.numLastLoopPoints < 3) {
      throw new Error(`beginInnerLoop: numLastLoopPoints:${this.numLastLoopPoints}, numLoopPoints:${this.numLoopPoints}`)
    }

    this._loopLengthes.push(this._loopLengthes[this._loopLengthes.length - 1])
  }

  addLoopPoint(x: number, y: number): number {
    if (this.numPoints > this.numLoopPoints) {
      throw new Error(`addLoopPoint: numPoints:${this.numPoints}, numLoopPoints:${this.numLoopPoints}`)
    }

    this._points.push(x, y)
    this._loopLengthes[this._loopLengthes.length - 1] += LoopState.POINT_DATA_LENGTH

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

    if (typeof loopLength === 'number') {
      this._loopLengthes = [loopLength]
    } else {
      this._loopLengthes = loopLength
    }
  }
}
