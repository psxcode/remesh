/* eslint-disable max-params */
/* eslint-disable no-param-reassign */
/* eslint-disable sort-vars */
import type { LoopState } from './LoopState'
import { distToSegment2, isIntersecting, len2, isPointInSegmentABBB } from './utils'

// const printEdge = (p0: number, p1: number) => {
//   return `${p0 / 2}->${p1 / 2}`
// }
// const printEdgeListItem = (edges: readonly number[], i: number) => {
//   const aei1 = edges[i + 2]
//   const aei2 = edges[i + 3]
//   const aei3 = edges[i + 4]
//   const aei4 = edges[i + 5]

//   return `${printEdge(edges[i], edges[i + 1])},
//     [${aei1 >= 0 ? printEdge(edges[aei1], edges[aei1 + 1]) : 'NONE'}, ${aei2 >= 0 ? printEdge(edges[aei2], edges[aei2 + 1]) : 'NONE'}]
//     [${aei3 >= 0 ? printEdge(edges[aei3], edges[aei3 + 1]) : 'NONE'}, ${aei4 >= 0 ? printEdge(edges[aei4], edges[aei4 + 1]) : 'NONE'}]`
// }

type PointsData = number[]
type cPointsData = readonly number[]
type EdgesData = number[]
type TrisData = number[]
type cEdgesData = readonly number[]
type cTrisData = readonly number[]

export class MeshState {
  private _loopState: LoopState
  private _points: PointsData = []
  private _edges: EdgesData = []
  private _tris: TrisData = []
  private _edgesLengthes: number[] = [0]

  static readonly POINT_DATA_LENGTH = 2
  static readonly EDGE_DATA_LENGTH = 2
  static readonly TRI_DATA_LENGTH = 3

  static readonly BASE_EDGES_INDEX = 0
  static readonly PCLOUD_EDGES_INDEX = 1

  constructor(loopState: LoopState) {
    this._loopState = loopState
  }

  get pointsFlatArray(): cPointsData {
    return this._points
  }

  get edgesFlatArray(): cEdgesData {
    return this._edges
  }

  get trisFlatArray(): cTrisData {
    return this._tris
  }

  get edgesLengthes(): readonly number[] {
    return this._edgesLengthes
  }

  private doesIntersectEdge(p0: number, p1: number, flatFrom: number, flatTo: number): boolean {
    const points = this._points
    const edges = this._edges
    const x0 = points[p0]
    const y0 = points[p0 + 1]
    const x1 = points[p1]
    const y1 = points[p1 + 1]

    for (let i = flatFrom; i < flatTo; i += MeshState.EDGE_DATA_LENGTH) {
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

  private doesEdgeExists(pi: number, pii: number, flatFrom: number, flatTo: number): boolean {
    // console.log('-----------')
    const edges = this._edges

    for (let ei = flatFrom; ei < flatTo; ei += MeshState.EDGE_DATA_LENGTH) {
      const epi = edges[ei]
      const epii = edges[ei + 1]

      // console.log(`${pi / 2}->${pii / 2}:${epi / 2}->${epii / 2}`)

      if ((pi === epi && pii === epii) || (pi === epii && pii === epi)) {
        // console.log('  EXISTS')

        return true
      }
    }

    return false
  }

  private isMiddleOutsideLoop(p0: number, p1: number): boolean {
    const points = this._points

    return !this._loopState.isPointInsideAllLoops(
      (points[p0] + points[p1]) * 0.5,
      (points[p0 + 1] + points[p1 + 1]) * 0.5
    )
  }

  private isAnyPointNearbyEdge(p0: number, p1: number, flatFrom: number, flatTo: number): boolean {
    const points = this._points
    const dist2 = 1
    const bx = points[p0]
    const by = points[p0 + 1]
    const tx = points[p1]
    const ty = points[p1 + 1]

    // console.log(`${bpi / 2}->${tpi / 2}`)

    for (let i = flatFrom; i < flatTo; i += MeshState.POINT_DATA_LENGTH) {
      if (i === p0 || i === p1) {
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

  private discardLongerMeshEdges(ei: number, /* out */discardedEdgeIndexes: number[]): number | null {
    discardedEdgeIndexes.length = 0

    const points = this._points
    const meshEdges = this._edges
    const pi0 = meshEdges[ei]
    const pi1 = meshEdges[ei + 1]
    const x0 = points[pi0]
    const y0 = points[pi0 + 1]
    const x1 = points[pi1]
    const y1 = points[pi1 + 1]
    const len = len2(x0, y0, x1, y1)

    // console.log(`BEGIN: ${pi0 / 2}->${pi1 / 2}`)

    for (let mei = this._edgesLengthes[MeshState.PCLOUD_EDGES_INDEX]; mei < meshEdges.length; mei += MeshState.EDGE_DATA_LENGTH) {
      const i0 = meshEdges[mei]
      const i1 = meshEdges[mei + 1]
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

          return mei
        }

        // Is shorter
        discardedEdgeIndexes.push(mei)
      }
    }

    // console.log('  DISCARD COMPARANTS')

    return null
  }

  private discardEdges(discardIndexes: readonly number[]) {
    const EDGE_DATA_LENGTH = MeshState.EDGE_DATA_LENGTH
    const meshEdges = this._edges

    // Mark discarded edges with -1
    for (let i = 0; i < discardIndexes.length; i++) {
      meshEdges[discardIndexes[i]] = -1
    }

    for (let ei = this._edgesLengthes[MeshState.PCLOUD_EDGES_INDEX], len = meshEdges.length; ei < len; ei += EDGE_DATA_LENGTH) {
      // Find marked edges
      if (meshEdges[ei] === -1) {
        // Shift next edges data over the previous
        for (let i = ei + EDGE_DATA_LENGTH; i < meshEdges.length; i += EDGE_DATA_LENGTH) {
          meshEdges[i - EDGE_DATA_LENGTH] = meshEdges[i]
          meshEdges[i - EDGE_DATA_LENGTH + 1] = meshEdges[i + 1]
          meshEdges[i - EDGE_DATA_LENGTH + 2] = meshEdges[i + 2]
          meshEdges[i - EDGE_DATA_LENGTH + 3] = meshEdges[i + 3]
        }

        // Subtract removed edge indexes
        meshEdges.length -= EDGE_DATA_LENGTH
        ei -= EDGE_DATA_LENGTH
        len -= EDGE_DATA_LENGTH
      }
    }
  }

  clear() {
    this._points.length = 0
    this._edges.length = 0
    this._tris.length = 0
  }

  generate(dist: number) {
    this.clear()

    if (!Number.isInteger(dist) || dist <= 0) {
      throw new Error(`generatePCloud: dist:${dist}`)
    }

    const points = this._points
    const edges = this._edges
    const origPoints = this._loopState.pointsFlatArray
    const origLoopLength = this._loopState.loopLengthes
    const origEdges = this._loopState.edgesFlatArray

    // Copy loops as edges
    for (let li = 0 ; li < origLoopLength.length; li++) {
      const loopStart = li === 0 ? 0 : origLoopLength[li - 1]
      const loopEnd = origLoopLength[li]
      const loopDiff = loopEnd - loopStart

      for (let pi = loopStart; pi < loopEnd; pi += MeshState.POINT_DATA_LENGTH) {
        points.push(origPoints[pi], origPoints[pi + 1])
        edges.push(pi, (pi + MeshState.POINT_DATA_LENGTH - loopStart) % loopDiff + loopStart)
      }
    }

    // Copy rest points
    for (let pi = origLoopLength[origLoopLength.length - 1]; pi < origPoints.length; pi++) {
      points.push(origPoints[pi])
    }

    // Copy constraint edges
    for (let ei = 0; ei < origEdges.length; ei += 2) {
      edges.push(origEdges[ei], origEdges[ei + 1])
    }

    // Subdivide edges
    for (let ei = 0, elen = edges.length; ei < elen; ei += MeshState.EDGE_DATA_LENGTH) {
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

    const basePointsLength = points.length
    const baseEdgesLength = edges.length

    this._edgesLengthes[MeshState.BASE_EDGES_INDEX] = baseEdgesLength

    // Point cloud
    const aabb = this._loopState.getAABB()
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
          !this._loopState.isPointInsideAllLoops(x, y) ||
          this._loopState.findLoopEdgeNearby(x, y, loopMinDist) !== null ||
          this._loopState.findEdgeNearby(x, y, edgeMinDist) !== null ||
          this._loopState.findEdgePointNearby(x, y, edgeMinDist) !== null
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

    const pCloudPointsLength = points.length
    const pCloudEdgesLength = edges.length

    this._edgesLengthes[MeshState.PCLOUD_EDGES_INDEX] = pCloudEdgesLength

    const maxEdgeLenToBase = dist * dist * 32
    const maxEdgeLenToPCloud = dist * dist * 16

    // Begin from all Base points
    for (let pi = 0; pi < basePointsLength; pi += MeshState.POINT_DATA_LENGTH) {
      // To all Base points
      for (let pii = 0; pii < basePointsLength; pii += MeshState.POINT_DATA_LENGTH) {
        if (pi === pii) {
          continue
        }

        // Limit possible edge length
        if (len2(points[pi], points[pi + 1], points[pii], points[pii + 1]) > maxEdgeLenToBase) {
          continue
        }

        if (
          // Base edges range
          this.doesEdgeExists(pi, pii, 0, baseEdgesLength) ||
          // Mesh edges range
          this.doesEdgeExists(pi, pii, pCloudEdgesLength, edges.length)
        ) {
          continue
        }

        // Discard over-subdivision edges
        if (this.isAnyPointNearbyEdge(pi, pii, 0, basePointsLength)) {
          continue
        }

        // Base edges length
        if (this.doesIntersectEdge(pi, pii, 0, baseEdgesLength)) {
          continue
        }

        if (this.isMiddleOutsideLoop(pi, pii)) {
          continue
        }

        // Point cloud edges range
        if (this.doesIntersectEdge(pi, pii, baseEdgesLength, pCloudEdgesLength)) {
          continue
        }

        edges.push(pi, pii)
      }

      // To all pCloud points
      for (let pii = basePointsLength; pii < pCloudPointsLength; pii += MeshState.POINT_DATA_LENGTH) {
        // Limit edge length
        if (len2(points[pi], points[pi + 1], points[pii], points[pii + 1]) > maxEdgeLenToPCloud) {
          continue
        }

        // Base edges length
        if (this.doesIntersectEdge(pi, pii, 0, baseEdgesLength)) {
          continue
        }

        // Point cloud edges range
        if (this.doesIntersectEdge(pi, pii, baseEdgesLength, pCloudEdgesLength)) {
          continue
        }

        edges.push(pi, pii)
      }
    }

    // Discard phase
    const tempNumbers: number[] = []

    for (let mei = pCloudEdgesLength, len = edges.length; mei < len;) {
      const shorterEdgeIndex = this.discardLongerMeshEdges(mei, tempNumbers)

      if (shorterEdgeIndex !== null) {
        // Swap edge points
        const t0 = edges[mei]
        const t1 = edges[mei + 1]

        edges[mei] = edges[shorterEdgeIndex]
        edges[mei + 1] = edges[shorterEdgeIndex + 1]
        edges[shorterEdgeIndex] = t0
        edges[shorterEdgeIndex + 1] = t1

        continue
      }

      if (tempNumbers.length > 0) {
        // console.log('LONGER EDGES', `${indices[i] / 2} -> ${indices[i + 1] / 2}`, tempNumbers.map((i) => `${indices[i] / 2} -> ${indices[i + 1] / 2}`))
        this.discardEdges(tempNumbers)
        len -= MeshState.EDGE_DATA_LENGTH * tempNumbers.length
      }

      mei += MeshState.EDGE_DATA_LENGTH
    }

    const ael = MeshState.buildAdjacentEdgesList(edges)
    const edgeStack: number[] = [0]
    const tris = this._tris

    while (edgeStack.length > 0) {
      const ei0 = edgeStack.pop()!
      const ei1 = ael[ei0 + 2]
      const ei2 = ael[ei0 + 3]

      // Skip if no adjacent
      if (ei1 < 0) {
        continue
      }

      // Remove used adjacent links
      MeshState.clearEdgeLink(ael, ei1, ei0)
      MeshState.clearEdgeLink(ael, ei2, ei0)

      const pi0 = ael[ei0]
      const pi1 = ael[ei0 + 1]
      const pi2 = (ael[ei1] === pi0 || ael[ei1] === pi1) ? ael[ei1 + 1] : ael[ei1]
      const cross = (points[pi1] - points[pi0]) * (points[pi2 + 1] - points[pi0 + 1]) - (points[pi2] - points[pi0]) * (points[pi1 + 1] - points[pi0 + 1])

      if (cross < 0) {
        tris.push(pi0, pi1, pi2)
      } else {
        tris.push(pi0, pi2, pi1)
      }

      edgeStack.push(ei1, ei2)
    }
  }

  private static clearEdgeLink(adjacentEdgeList: number[], sourceEdgeIndex: number, targetEdgeIndex: number) {
    if (adjacentEdgeList[sourceEdgeIndex + 2] === targetEdgeIndex || adjacentEdgeList[sourceEdgeIndex + 3] === targetEdgeIndex) {
      adjacentEdgeList[sourceEdgeIndex + 2] = adjacentEdgeList[sourceEdgeIndex + 4]
      adjacentEdgeList[sourceEdgeIndex + 3] = adjacentEdgeList[sourceEdgeIndex + 5]
    }

    adjacentEdgeList[sourceEdgeIndex + 4] = -1
    adjacentEdgeList[sourceEdgeIndex + 5] = -1
  }

  private static buildAdjacentEdgesList(edges: cEdgesData): number[] {
    const edgeLL: number[] = []
    const ELL_DATA_SIZE = 6

    for (let ei = 0; ei < edges.length; ei += MeshState.EDGE_DATA_LENGTH) {
      edgeLL.push(edges[ei], edges[ei + 1], -2, -2, -2, -2)
    }

    // Find adjacent edges
    for (let ei = 0; ei < edgeLL.length; ei += ELL_DATA_SIZE) {
      const p00 = edgeLL[ei]
      const p01 = edgeLL[ei + 1]

      let numPtsFound = 0

      for (let ei1 = 0; ei1 < edgeLL.length; ei1 += ELL_DATA_SIZE) {
        // Skip same edge index
        if (ei === ei1) {
          continue
        }

        // Skip if edge has already been stored as adjacent
        if (edgeLL[ei + 2] === ei1 || edgeLL[ei + 3] === ei1) {
          continue
        }

        const p10 = edgeLL[ei1]
        const p11 = edgeLL[ei1 + 1]

        let otherP0 = -1
        let otherP1 = -1

        if (p00 === p10) {
          otherP0 = p01
          otherP1 = p11
        }

        if (p00 === p11) {
          otherP0 = p01
          otherP1 = p10
        }

        if (p01 === p10) {
          otherP0 = p00
          otherP1 = p11
        }

        if (p01 === p11) {
          otherP0 = p00
          otherP1 = p10
        }

        // Didnt find same point on edge
        if (otherP0 < 0) {
          continue
        }

        for (let ei2 = 0; ei2 < edgeLL.length; ei2 += ELL_DATA_SIZE) {
          if (ei2 === ei || ei2 === ei1) {
            continue
          }

          const p20 = edgeLL[ei2]
          const p21 = edgeLL[ei2 + 1]

          if ((p20 === otherP0 && p21 === otherP1) || (p21 === otherP0 && p20 === otherP1)) {
            const offset = numPtsFound > 0 ? 2 : 0

            edgeLL[ei + 2 + offset] = ei1
            edgeLL[ei + 3 + offset] = ei2
            ++numPtsFound

            break
          }
        }

        if (numPtsFound === 2) {
          break
        }
      }
    }

    return edgeLL
  }
}
