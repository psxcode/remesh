import { drawEdges, drawLoop, drawPoints } from './draw'
import { getLoopAABB, isPointNearPoints, calcEdges } from './math'

const WIDTH = 640
const HEIGHT = 480

const createLoopBtn = document.getElementById('create-loop')!
const saveLoopBtn = document.getElementById('save-loop')!
const loadLoopBtn = document.getElementById('load-loop')!
const canvas = document.getElementById('canvas') as HTMLCanvasElement

canvas.width = WIDTH
canvas.height = HEIGHT

const ctx = canvas.getContext('2d')!
let isCreateLoopActive = false

const loopPoints: number[] = []
const indices: number[] = []
const aabb: number[] = []

const render = () => {
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, WIDTH, HEIGHT)
  ctx.fillStyle = 'black'

  drawPoints(ctx, loopPoints)

  if (loopPoints.length > 1) {
    ctx.strokeStyle = 'red'
    drawLoop(ctx, loopPoints, !isCreateLoopActive)
  }

  if (aabb.length > 0) {
    ctx.strokeStyle = 'green'
    drawLoop(ctx, aabb)
  }

  ctx.strokeStyle = 'black'

  if (indices.length > 0) {
    drawEdges(ctx, loopPoints, indices)
  }
}

const recalc = () => {
  if (loopPoints.length > 3) {
    indices.length = 0
    indices.push(...calcEdges(loopPoints))

    aabb.length = 0
    aabb.push(...getLoopAABB(loopPoints))
  }
}

const setCreatingEnabled = (isEnabled: boolean) => {
  isCreateLoopActive = isEnabled

  if (isEnabled) {
    loopPoints.length = 0
    indices.length = 0
    aabb.length = 0
    createLoopBtn.setAttribute('active', '')
    saveLoopBtn.setAttribute('disabled', '')
    loadLoopBtn.setAttribute('disabled', '')
  } else {
    createLoopBtn.removeAttribute('active')
    saveLoopBtn.removeAttribute('disabled')
    loadLoopBtn.removeAttribute('disabled')

    recalc()
  }

  render()
}

createLoopBtn.addEventListener('click', () => {
  setCreatingEnabled(!isCreateLoopActive)
})
canvas.addEventListener('click', (e) => {
  if (!isCreateLoopActive) {
    return
  }

  if (isPointNearPoints(e.clientX, e.clientY, loopPoints)) {
    return
  }

  loopPoints.push(e.clientX, e.clientY)

  render()
})

canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault()

  setCreatingEnabled(false)
})

saveLoopBtn.addEventListener('click', () => {
  localStorage.setItem('loopPoints', JSON.stringify(loopPoints))
})

loadLoopBtn.addEventListener('click', () => {
  const data = localStorage.getItem('loopPoints')

  if (data !== null) {
    try {
      const pts = JSON.parse(data)

      loopPoints.length = 0
      loopPoints.push(...pts)
    } catch {}

    recalc()
    render()
  }
})

// console.log(
//   isPointInsideLoop(pt, loopPoints)
// )

// canvas.addEventListener('click', (e) => {
//   console.log(
//     isPointInsideLoop({ x: e.clientX, y: e.clientY }, loopPoints)
//   )
// })

// console.log(
//   Math.sqrt(distToSegment2(pt, loopPoints[1], loopPoints[2]))
// )
// console.log(
//   Math.sqrt(distToLine2(pt, loopPoints[1], loopPoints[2]))
// )

// drawPoints(ctx, [
//   projToLine(pt, loopPoints[1], loopPoints[2]),
// ])
// console.log(
//   Math.sqrt(distToLine2(pt, loopPoints[1], loopPoints[2]))
// )

// console.log(
//   isLineOnLine(pt, pt2, loopPoints[1], loopPoints[2])
// )

