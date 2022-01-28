import type { Points } from './math'

export class Draw {
  ctx: CanvasRenderingContext2D
  pointColor = 'black'
  edgeColor = 'black'
  loopColor = 'red'
  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx
  }

  drawLoop(state: Points, shouldClosePath: boolean) {
    const ctx = this.ctx
    const points = state.pointsFlatArray
    const loopLength = state.numLoopPoints * 2

    ctx.save()
    ctx.strokeStyle = this.loopColor

    ctx.beginPath()

    ctx.moveTo(points[0], points[1])

    for (let i = 2; i < loopLength; i += 2) {
      ctx.lineTo(points[i], points[i + 1])
    }

    shouldClosePath && ctx.closePath()
    ctx.stroke()

    ctx.restore()
  }

  drawEdges(state: Points) {
    const ctx = this.ctx
    const points = state.pointsFlatArray
    const edges = state.edgesFlatArray

    ctx.save()
    ctx.strokeStyle = this.edgeColor

    ctx.beginPath()

    for (let i = 0; i < edges.length; i += 2) {
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
  }

  drawPoints(state: Points) {
    const ctx = this.ctx
    const points = state.pointsFlatArray

    ctx.save()
    ctx.fillStyle = this.pointColor

    for (let i = 0; i < points.length; i += 2) {
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

