import type { LoopState, MeshState } from './math'
import { EDGE_DATA_LENGTH, MESH_EDGE_DATA_LENGTH, POINT_DATA_LENGTH } from './math'

export class Draw {
  ctx: CanvasRenderingContext2D
  pointColor = 'black'
  cloudPointsColor = 'rgba(0, 0, 255, 0.6)'
  edgeColor = 'rgba(0, 0, 0, 0.4)'
  cloudEdgeColor = 'rgba(0, 0, 255, 0.4)'
  meshColor = 'rgba(255, 128, 0, 0.4)'
  loopColor = 'red'
  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx
  }

  drawLoop(state: LoopState, shouldClosePath: boolean) {
    const ctx = this.ctx
    const points = state.pointsFlatArray

    if (state.getNumLoopPoints(0) === 0) {
      return
    }

    ctx.save()
    ctx.strokeStyle = this.loopColor

    for (let i = 0, numLoops = state.numLoops; i < numLoops; i++) {
      const loopStart = state.getNumLoopPoints(i - 1)
      const loopEnd = state.getNumLoopPoints(i)
      const isLastLoop = i === numLoops - 1

      ctx.beginPath()

      ctx.moveTo(points[loopStart], points[loopStart + 1])

      for (let i = loopStart + 2; i < loopEnd; i += 2) {
        ctx.lineTo(points[i], points[i + 1])
      }

      if (!isLastLoop || shouldClosePath) {
        ctx.closePath()
      }

      ctx.stroke()
    }

    ctx.restore()
  }

  drawEdges(state: LoopState) {
    const ctx = this.ctx
    const points = state.pointsFlatArray
    const edges = state.edgesFlatArray

    if (edges.length === 0) {
      return
    }

    ctx.save()
    ctx.strokeStyle = this.edgeColor

    ctx.beginPath()

    for (let i = 0; i < edges.length; i += EDGE_DATA_LENGTH) {
      const pi0 = edges[i]
      const pi1 = edges[i + 1]

      ctx.moveTo(points[pi0], points[pi0 + 1])
      ctx.lineTo(points[pi1], points[pi1 + 1])
    }

    ctx.stroke()
    ctx.restore()
  }

  drawPCloud(state: MeshState) {
    const ctx = this.ctx
    const points = state.pointsFlatArray

    if (points.length === 0) {
      return
    }

    {
      const edges = state.edgesFlatArray

      ctx.save()
      ctx.fillStyle = this.cloudPointsColor

      for (let i = 0; i < points.length; i += POINT_DATA_LENGTH) {
        ctx.fillRect(points[i] - 1, points[i + 1] - 1, 2, 2)
      }

      // Edges
      ctx.strokeStyle = this.cloudEdgeColor
      ctx.beginPath()

      for (let i = 0; i < edges.length; i += EDGE_DATA_LENGTH) {
        const pi0 = edges[i]
        const pi1 = edges[i + 1]

        ctx.moveTo(points[pi0], points[pi0 + 1])
        ctx.lineTo(points[pi1], points[pi1 + 1])
      }

      ctx.stroke()
      ctx.restore()
    }

    {
      const edges = state.meshEdgesFlatArray

      if (edges.length === 0) {
        return
      }

      ctx.save()
      ctx.strokeStyle = this.meshColor

      ctx.beginPath()

      for (let i = 0; i < edges.length; i += MESH_EDGE_DATA_LENGTH) {
        const pi0 = edges[i]
        const pi1 = edges[i + 1]
        const p0x = points[pi0]
        const p0y = points[pi0 + 1]
        const p1x = points[pi1]
        const p1y = points[pi1 + 1]

        ctx.moveTo(p0x, p0y)
        ctx.lineTo(p1x, p1y)
      }

      ctx.stroke()
      ctx.restore()
    }
  }

  drawPoints(state: LoopState) {
    const ctx = this.ctx
    const points = state.pointsFlatArray
    const numLoops = state.numLoops

    ctx.save()
    ctx.fillStyle = this.pointColor

    // Loop points
    for (let li = 0; li < numLoops; li++) {
      const loopStart = state.getNumLoopPoints(li - 1)
      const loopEnd = state.getNumLoopPoints(li)

      // Draw firts point bigger
      ctx.fillRect(points[loopStart] - 4, points[loopStart + 1] - 4, 8, 8)

      for (let i = POINT_DATA_LENGTH; i < loopEnd; i += POINT_DATA_LENGTH) {
        ctx.fillRect(points[i] - 2, points[i + 1] - 2, 4, 4)
      }
    }

    // Rest points
    const firstPointAfterLoops = state.numLoopPoints * POINT_DATA_LENGTH

    for (let i = firstPointAfterLoops; i < points.length; i += POINT_DATA_LENGTH) {
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

  clearRect(x: number, y: number, width: number, height: number) {
    this.ctx.clearRect(x, y, width, height)
  }
}

