/* eslint-disable max-params */
export const drawLoop = (ctx: CanvasRenderingContext2D, points: readonly number[], pointsLength: number, shouldClosePath: boolean, color = 'red') => {
  ctx.save()
  ctx.strokeStyle = color

  ctx.beginPath()

  ctx.moveTo(points[0], points[1])

  for (let i = 2; i < pointsLength; i += 2) {
    ctx.lineTo(points[i], points[i + 1])
  }

  shouldClosePath && ctx.closePath()
  ctx.stroke()

  ctx.restore()
}

export const drawEdges = (ctx: CanvasRenderingContext2D, points: readonly number[], edges: readonly number[], color = 'black') => {
  ctx.save()
  ctx.strokeStyle = color

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

export const drawPoints = (ctx: CanvasRenderingContext2D, points: readonly number[], color = 'black') => {
  ctx.save()
  ctx.fillStyle = color

  for (let i = 0; i < points.length; i += 2) {
    ctx.fillRect(points[i] - 2, points[i + 1] - 2, 4, 4)
  }

  ctx.restore()
}
