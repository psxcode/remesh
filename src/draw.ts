import type { Edges, Loop, Pt } from './types'

export const drawLoop = (ctx: CanvasRenderingContext2D, points: readonly Pt[], shouldClosePath: boolean = true) => {
  ctx.beginPath()

  ctx.moveTo(points[0].x, points[0].y)

  for (let i = 1; i < points.length; i++) {
    const p = points[i]

    ctx.lineTo(p.x, p.y)
  }

  shouldClosePath && ctx.closePath()
  ctx.stroke()
}

export const drawEdges = (ctx: CanvasRenderingContext2D, points: Pt[], indices: number[]) => {
  ctx.beginPath()

  for (let i = 1; i < indices.length; i += 2) {
    const p0 = points[indices[i - 1]]
    const p1 = points[indices[i]]

    ctx.moveTo(p0.x, p0.y)
    ctx.lineTo(p1.x, p1.y)
  }

  ctx.stroke()
}

export const drawPoints = (ctx: CanvasRenderingContext2D, points: readonly Pt[]) => {
  for (let i = 0; i < points.length; i++) {
    ctx.fillRect(points[i].x - 2, points[i].y - 2, 4, 4)
  }
}
