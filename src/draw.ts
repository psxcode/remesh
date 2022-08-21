import { LoopState } from './LoopState'
import { MeshState } from './MeshState'

export class Draw {
  ctx: CanvasRenderingContext2D
  pointColor = 'black'
  cloudPointsColor = 'rgba(0, 0, 255, 0.6)'
  edgeColor = 'rgba(0, 0, 0, 0.4)'
  baseEdgeColor = 'rgba(255, 0, 0, 0.8)'
  cloudEdgeColor = 'rgba(0, 0, 255, 0.4)'
  meshEdgeColor = 'rgba(255, 128, 0, 0.4)'
  triColor = 'rgba(0, 128, 128, 0.2)'
  loopColor = 'rgba(0, 0, 0, 0.4)'
  activeLoopColor = 'red'
  #width = 0
  #height = 0
  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx
    this.#width = width
    this.#height = height
  }

  drawLoop(ls: LoopState, shouldCloseLastLoop: boolean, isActiveLoop: boolean) {
    const ctx = this.ctx
    const points = ls.pointsFlatArray

    if (ls.getLoopDataEnd(0) === 0) {
      // Empty loop
      return
    }

    ctx.save()
    ctx.strokeStyle = isActiveLoop ? this.activeLoopColor : this.loopColor

    for (let i = 0, numLoops = ls.numLoops; i < numLoops; i++) {
      const loopBegin = ls.getLoopDataBegin(i)
      const loopEnd = ls.getLoopDataEnd(i)
      const isLastLoop = i === numLoops - 1

      ctx.beginPath()

      ctx.moveTo(points[loopBegin], points[loopBegin + 1])

      for (let i = loopBegin + 2; i < loopEnd; i += 2) {
        ctx.lineTo(points[i], points[i + 1])
      }

      if (!isLastLoop || !isActiveLoop || shouldCloseLastLoop) {
        ctx.closePath()
      }

      ctx.stroke()
    }

    ctx.restore()
  }

  drawEdges(ls: LoopState) {
    const ctx = this.ctx
    const points = ls.pointsFlatArray
    const edges = ls.edgesFlatArray

    if (edges.length === 0) {
      return
    }

    ctx.save()
    ctx.strokeStyle = this.edgeColor

    ctx.beginPath()

    for (let i = 0; i < edges.length; i += LoopState.EDGE_DATA_LENGTH) {
      const pi0 = edges[i]
      const pi1 = edges[i + 1]

      ctx.moveTo(points[pi0], points[pi0 + 1])
      ctx.lineTo(points[pi1], points[pi1 + 1])
    }

    ctx.stroke()
    ctx.restore()
  }

  drawMesh(state: MeshState, viewBaseEdges: boolean, viewCloudEdges: boolean, viewTris: boolean) {
    const ctx = this.ctx
    const points = state.pointsFlatArray
    const edges = state.edgesFlatArray
    const edgeLengthes = state.edgesLengthes
    const tris = state.trisFlatArray

    if (points.length === 0) {
      return
    }

    ctx.save()

    // Points
    ctx.fillStyle = this.cloudPointsColor

    for (let i = 0; i < points.length; i += MeshState.POINT_DATA_LENGTH) {
      ctx.fillRect(points[i] - 1, points[i + 1] - 1, 2, 2)
    }

    // Base Edges
    if (viewBaseEdges) {
      ctx.strokeStyle = this.baseEdgeColor
      ctx.beginPath()

      for (let i = 0; i < edgeLengthes[MeshState.BASE_EDGES_INDEX]; i += MeshState.EDGE_DATA_LENGTH) {
        const pi0 = edges[i]
        const pi1 = edges[i + 1]

        ctx.moveTo(points[pi0], points[pi0 + 1])
        ctx.lineTo(points[pi1], points[pi1 + 1])
      }

      ctx.stroke()
    }

    // PCloud edges
    if (viewCloudEdges) {
      ctx.strokeStyle = this.cloudEdgeColor
      ctx.beginPath()

      for (let i = edgeLengthes[MeshState.BASE_EDGES_INDEX]; i < edgeLengthes[MeshState.PCLOUD_EDGES_INDEX]; i += MeshState.EDGE_DATA_LENGTH) {
        const pi0 = edges[i]
        const pi1 = edges[i + 1]

        ctx.moveTo(points[pi0], points[pi0 + 1])
        ctx.lineTo(points[pi1], points[pi1 + 1])
      }

      ctx.stroke()
    }

    // Mesh edges
    ctx.strokeStyle = this.meshEdgeColor
    ctx.beginPath()

    for (let i = edgeLengthes[MeshState.PCLOUD_EDGES_INDEX]; i < edges.length; i += MeshState.EDGE_DATA_LENGTH) {
      const pi0 = edges[i]
      const pi1 = edges[i + 1]

      ctx.moveTo(points[pi0], points[pi0 + 1])
      ctx.lineTo(points[pi1], points[pi1 + 1])
    }

    ctx.stroke()

    // Tris
    if (viewTris) {
      ctx.fillStyle = this.triColor

      for (let i = 0; i < tris.length; i += MeshState.TRI_DATA_LENGTH) {
        const pi0 = tris[i]
        const pi1 = tris[i + 1]
        const pi2 = tris[i + 2]

        ctx.beginPath()
        ctx.moveTo(points[pi0], points[pi0 + 1])
        ctx.lineTo(points[pi1], points[pi1 + 1])
        ctx.lineTo(points[pi2], points[pi2 + 1])
        ctx.closePath()
        ctx.fill()
      }
    }

    ctx.restore()
  }

  drawPoints(state: LoopState) {
    const ctx = this.ctx
    const points = state.pointsFlatArray
    const numLoops = state.numLoops

    ctx.save()
    ctx.fillStyle = this.pointColor

    // Loop points
    for (let li = 0; li < numLoops; li++) {
      const loopBegin = state.getLoopDataBegin(li)
      const loopEnd = state.getLoopDataEnd(li)

      // Draw firts point bigger
      ctx.fillRect(points[loopBegin] - 4, points[loopBegin + 1] - 4, 8, 8)

      for (let i = LoopState.POINT_DATA_LENGTH; i < loopEnd; i += LoopState.POINT_DATA_LENGTH) {
        ctx.fillRect(points[i] - 2, points[i + 1] - 2, 4, 4)
      }
    }

    // Rest points
    const firstPointAfterLoops = state.numLoopPoints * LoopState.POINT_DATA_LENGTH

    for (let i = firstPointAfterLoops; i < points.length; i += LoopState.POINT_DATA_LENGTH) {
      ctx.fillRect(points[i] - 2, points[i + 1] - 2, 4, 4)
    }

    ctx.restore()
  }

  drawInteractiveLine(x0: number, y0: number, x1: number, y1: number) {
    const ctx = this.ctx

    ctx.save()
    ctx.strokeStyle = 'red'

    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(x1, y1)
    ctx.stroke()

    ctx.restore()
  }

  clear() {
    this.ctx.clearRect(0, 0, this.#width, this.#height)
  }
}

