import type { Points } from './math'

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

  drawLoop(state: Points, shouldClosePath: boolean) {
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

  drawEdges(state: Points) {
    const ctx = this.ctx
    const points = state.pointsFlatArray
    const edges = state.edgesFlatArray

    if (edges.length === 0) {
      return
    }

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
    ctx.restore()
  }

  drawMesh(state: Points) {
    const ctx = this.ctx
    const points = state.pointsFlatArray
    const edges = state.meshEdgesFlatArray

    if (edges.length === 0) {
      return
    }

    ctx.save()
    ctx.strokeStyle = this.meshColor

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

  drawPCloud(state: Points) {
    const ctx = this.ctx
    const points = state.cloudPointsFlatArray
    const edges = state.cloudEdgesFlatArray

    if (points.length === 0) {
      return
    }

    ctx.save()
    ctx.fillStyle = this.cloudPointsColor

    for (let i = 0; i < points.length; i += 2) {
      ctx.fillRect(points[i] - 1, points[i + 1] - 1, 2, 2)
    }

    // Edges
    ctx.strokeStyle = this.cloudEdgeColor
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
    ctx.restore()
  }

  drawPoints(state: Points) {
    const ctx = this.ctx
    const points = state.pointsFlatArray
    const numLoops = state.numLoops

    ctx.save()
    ctx.fillStyle = this.pointColor

    // Loop points
    for (let li = 0; li < numLoops; li++) {
      const loopStart = state.getNumLoopPoints(li - 1)
      const loopEnd = state.getNumLoopPoints(li)

      ctx.fillRect(points[loopStart] - 4, points[loopStart + 1] - 4, 8, 8)

      for (let i = 2; i < loopEnd; i += 2) {
        ctx.fillRect(points[i] - 2, points[i + 1] - 2, 4, 4)
      }
    }

    // Rest points
    const firstPointAfterLoops = state.numLoopPoints * 2

    for (let i = firstPointAfterLoops; i < points.length; i += 2) {
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

