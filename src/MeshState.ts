/* eslint-disable max-params */
/* eslint-disable no-param-reassign */
/* eslint-disable sort-vars */
import type { LoopState } from './LoopState'
import { distToSegment2, isIntersecting, len2 } from './utils'

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

type PointsData = number[]
type cPointsData = readonly number[]
type EdgesData = number[]
type cEdgesData = readonly number[]

export class MeshState {
  private loopState: LoopState
  private points: PointsData = []
  private edges: EdgesData = []
  private meshEdges: EdgesData = []

  static readonly POINT_DATA_LENGTH = 2
  static readonly EDGE_DATA_LENGTH = 2
  static readonly MESH_EDGE_DATA_LENGTH = 2

  constructor(loopState: LoopState) {
    this.loopState = loopState
  }

  get meshEdgesFlatArray(): cEdgesData {
    return this.meshEdges
  }

  get pointsFlatArray(): cPointsData {
    return this.points
  }

  get edgesFlatArray(): cEdgesData {
    return this.edges
  }

  get numMeshEdges() {
    return this.meshEdges.length / MeshState.MESH_EDGE_DATA_LENGTH
  }

  private doesIntersectEdge(p0: number, p1: number): boolean {
    const points = this.points
    const edges = this.edges
    const x0 = points[p0]
    const y0 = points[p0 + 1]
    const x1 = points[p1]
    const y1 = points[p1 + 1]

    for (let i = 0; i < edges.length; i += MeshState.EDGE_DATA_LENGTH) {
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

  private doesEdgeExists(pi: number, pii: number): boolean {
    // console.log('-----------')
    const edges = this.edges
    const meshEdges = this.meshEdges

    for (let ei = 0; ei < edges.length; ei += MeshState.EDGE_DATA_LENGTH) {
      const epi = edges[ei]
      const epii = edges[ei + 1]

      // console.log(`${pi / 2}->${pii / 2}:${epi / 2}->${epii / 2}`)

      if ((pi === epi && pii === epii) || (pi === epii && pii === epi)) {
        // console.log('  EXISTS')

        return true
      }
    }

    for (let ei = 0; ei < meshEdges.length; ei += MeshState.MESH_EDGE_DATA_LENGTH) {
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

  private isMiddleOutsideLoop(p0: number, p1: number): boolean {
    const points = this.points

    return !this.loopState.isPointInsideAllLoops(
      (points[p0] + points[p1]) * 0.5,
      (points[p0 + 1] + points[p1 + 1]) * 0.5
    )
  }

  private isAnyPointNearbyEdge(flatBpi: number, flatTpi: number): boolean {
    const points = this.points
    const dist2 = 1
    const bx = points[flatBpi]
    const by = points[flatBpi + 1]
    const tx = points[flatTpi]
    const ty = points[flatTpi + 1]

    // console.log(`${bpi / 2}->${tpi / 2}`)

    for (let i = 0; i < points.length; i += MeshState.POINT_DATA_LENGTH) {
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

  private discardLongerMeshEdges(flatEdgeIndex: number, /* out */discardedEdgeIndexes: number[]): number | null {
    discardedEdgeIndexes.length = 0

    const points = this.points
    const meshEdges = this.meshEdges
    const pi0 = meshEdges[flatEdgeIndex]
    const pi1 = meshEdges[flatEdgeIndex + 1]
    const x0 = points[pi0]
    const y0 = points[pi0 + 1]
    const x1 = points[pi1]
    const y1 = points[pi1 + 1]
    const len = len2(x0, y0, x1, y1)

    // console.log(`BEGIN: ${pi0 / 2}->${pi1 / 2}`)

    for (let i = 0; i < meshEdges.length; i += MeshState.MESH_EDGE_DATA_LENGTH) {
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

  private discardEdges(discardIndexes: readonly number[]) {
    const edges = this.meshEdges
    const EDGE_DATA_LENGTH = MeshState.EDGE_DATA_LENGTH

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

  clear() {
    this.points.length = 0
    this.edges.length = 0
    this.meshEdges.length = 0
  }

  generate(dist: number) {
    this.clear()

    if (!Number.isInteger(dist) || dist <= 0) {
      throw new Error(`generatePCloud: dist:${dist}`)
    }

    const points = this.points
    const edges = this.edges
    const origPoints = this.loopState.pointsFlatArray
    const origLoopLength = this.loopState.loopLengthes
    const origEdges = this.loopState.edgesFlatArray

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
    for (let ei = 0; ei < origEdges.length; ei++) {
      edges.push(origEdges[ei])
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

    const pointsLength = points.length

    // Point cloud
    const aabb = this.loopState.getAABB()
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
          !this.loopState.isPointInsideAllLoops(x, y) ||
          this.loopState.findLoopEdgeNearby(x, y, loopMinDist) !== null ||
          this.loopState.findEdgeNearby(x, y, edgeMinDist) !== null ||
          this.loopState.findEdgePointNearby(x, y, edgeMinDist) !== null
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

    const meshEdges = this.meshEdges

    const maxEdgeLen1 = dist * dist * 32
    const maxEdgeLen2 = dist * dist * 16

    for (let pi = 0; pi < pointsLength; pi += MeshState.POINT_DATA_LENGTH) {
      for (let pii = 0; pii < pointsLength; pii += MeshState.POINT_DATA_LENGTH) {
        if (pi === pii) {
          continue
        }

        if (len2(points[pi], points[pi + 1], points[pii], points[pii + 1]) > maxEdgeLen1) {
          continue
        }

        if (this.doesEdgeExists(pi, pii)) {
          continue
        }

        if (this.doesIntersectEdge(pi, pii)) {
          continue
        }

        if (this.isMiddleOutsideLoop(pi, pii)) {
          continue
        }

        if (this.isAnyPointNearbyEdge(pi, pii)) {
          continue
        }

        meshEdges.push(pi, pii)
      }

      for (let pii = pointsLength; pii < points.length; pii += MeshState.POINT_DATA_LENGTH) {
        if (len2(points[pi], points[pi + 1], points[pii], points[pii + 1]) > maxEdgeLen2) {
          continue
        }

        if (this.doesIntersectEdge(pi, pii)) {
          continue
        }

        meshEdges.push(pi, pii)
      }
    }

    // Discard phase
    const tempNumbers: number[] = []

    for (let mei = 0, len = meshEdges.length; mei < len;) {
      const shorterEdgeIndex = this.discardLongerMeshEdges(mei, tempNumbers)

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
        this.discardEdges(tempNumbers)
        len -= MeshState.MESH_EDGE_DATA_LENGTH * tempNumbers.length
      }

      mei += MeshState.MESH_EDGE_DATA_LENGTH
    }
  }
}
