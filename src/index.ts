/* eslint-disable no-param-reassign */
import { LoopState } from './LoopState'
import { MeshState } from './MeshState'
import { Save } from './Save'
import { Draw } from './draw'

const WIDTH = 640
const HEIGHT = 480
const VERT_SNAP_DIST = 8
const rand = (int: number) => int + Math.random()

const resetBtn = document.getElementById('reset')!
const createLoopBtn = document.getElementById('create-loop')!
const createEdgeBtn = document.getElementById('create-edge')!
const createPCloudBtn = document.getElementById('create-pcloud')!
const pcloudScale = document.getElementById('pcloud-scale')! as HTMLInputElement
const viewLoopCheckbox = document.getElementById('view-loop')! as HTMLInputElement
const viewBaseEdgesCheckbox = document.getElementById('view-base-edges')! as HTMLInputElement
const viewCloudEdgesCheckbox = document.getElementById('view-cloud-edges')! as HTMLInputElement
const viewTrisCheckbox = document.getElementById('view-tris')! as HTMLInputElement
const bg = document.getElementById('bg') as HTMLCanvasElement
const fg = document.getElementById('fg') as HTMLCanvasElement

bg.width = WIDTH
bg.height = HEIGHT
fg.width = WIDTH
fg.height = HEIGHT

const BEGIN_MODE = 0
const CREATE_LOOP_MODE = 1
const CREATE_EDGE_MODE = 3
const DRAG_POINT_MODE = 4

const drawBg = new Draw(bg.getContext('2d')!)
const drawFg = new Draw(fg.getContext('2d')!)
let mode = BEGIN_MODE

const loopState = new LoopState()
const meshState = new MeshState(loopState)
let lpi = -1

const resetState = () => {
  loopState.clear()
  meshState.clear()
  mode = BEGIN_MODE
  lpi = -1

  createLoopBtn.removeAttribute('disabled')
  createEdgeBtn.removeAttribute('disabled')
  createPCloudBtn.removeAttribute('disabled')

  createLoopBtn.removeAttribute('active')
  createEdgeBtn.removeAttribute('active')
}

const render = () => {
  drawFg.clearRect(0, 0, WIDTH, HEIGHT)
  drawBg.clearRect(0, 0, WIDTH, HEIGHT)

  if (viewLoopCheckbox.checked) {
    drawBg.drawLoop(loopState, mode !== CREATE_LOOP_MODE)
    drawBg.drawEdges(loopState)
  }

  drawBg.drawMesh(meshState, viewBaseEdgesCheckbox.checked, viewCloudEdgesCheckbox.checked, viewTrisCheckbox.checked)

  if (viewLoopCheckbox.checked) {
    drawBg.drawPoints(loopState)
  }
}

void new Save({
  doc: document,
  storage: localStorage,
  ls: loopState,
  render,
  reset: resetState,
})

const renderInteractiveLine = (x0: number, y0: number) => {
  if (lpi < 0) {
    return
  }

  const points = loopState.pointsFlatArray
  const pi = lpi * 2
  const x1 = points[pi]
  const y1 = points[pi + 1]

  drawFg.clearRect(0, 0, WIDTH, HEIGHT)
  drawFg.drawInteractiveLine(x0, y0, x1, y1)
}

const handleInteractiveLine = (e: MouseEvent) => {
  renderInteractiveLine(e.clientX, e.clientY)
}

const addLoopPoint = (x: number, y: number) => {
  const nextPointIndex = loopState.addLoopPoint(x, y, lpi, VERT_SNAP_DIST)

  if (nextPointIndex !== null) {
    lpi = nextPointIndex
  }
}

const addConstraintPoint = (x: number, y: number) => {
  const nextPointIndex = loopState.addConstraintPoint(x, y, lpi, VERT_SNAP_DIST)

  if (nextPointIndex !== null) {
    lpi = nextPointIndex
  }
}

const setCreateEdgeEnabled = (isEnabled: boolean) => {
  if (isEnabled === false && mode !== CREATE_EDGE_MODE) {
    return
  }

  lpi = -1

  if (isEnabled) {
    meshState.clear()
    mode = CREATE_EDGE_MODE
    createEdgeBtn.setAttribute('active', '')
    createLoopBtn.setAttribute('disabled', '')
    createPCloudBtn.setAttribute('disabled', '')
    fg.addEventListener('mousemove', handleInteractiveLine)
  } else {
    mode = BEGIN_MODE
    createEdgeBtn.removeAttribute('active')
    createLoopBtn.removeAttribute('disabled')
    createPCloudBtn.removeAttribute('disabled')
    fg.removeEventListener('mousemove', handleInteractiveLine)
  }

  render()
}

const setCreateLoopEnabled = (isEnabled: boolean) => {
  if (isEnabled === false && mode !== CREATE_LOOP_MODE) {
    return
  }

  if (isEnabled) {
    const isInnerLoop = loopState.numPoints > 0

    meshState.clear()

    if (isInnerLoop) {
      loopState.clearEdges()
      loopState.beginInnerLoop()
    } else {
      loopState.clear()
    }

    mode = CREATE_LOOP_MODE
    lpi = -1

    createLoopBtn.setAttribute('active', '')
    createEdgeBtn.setAttribute('disabled', '')
    createPCloudBtn.setAttribute('disabled', '')
    fg.addEventListener('mousemove', handleInteractiveLine)
  } else {
    if (loopState.numLastLoopPoints <= 2) {
      loopState.clearLastLoop()
    }

    mode = BEGIN_MODE
    createLoopBtn.removeAttribute('active')
    createEdgeBtn.removeAttribute('disabled')
    createPCloudBtn.removeAttribute('disabled')
    fg.removeEventListener('mousemove', handleInteractiveLine)
  }

  render()
}

createLoopBtn.addEventListener('click', () => {
  setCreateLoopEnabled(mode === BEGIN_MODE)
})

createEdgeBtn.addEventListener('click', () => {
  setCreateEdgeEnabled(mode === BEGIN_MODE)
})

createPCloudBtn.addEventListener('click', () => {
  const scale = Number(pcloudScale.value)

  if (!Number.isInteger(scale)) {
    return
  }

  meshState.generate(scale)
  render()
})

resetBtn.addEventListener('click', () => {
  resetState()
  render()
})

viewLoopCheckbox.addEventListener('change', render)
viewBaseEdgesCheckbox.addEventListener('change', render)
viewCloudEdgesCheckbox.addEventListener('change', render)
viewTrisCheckbox.addEventListener('change', render)

fg.addEventListener('click', (e) => {
  const x = rand(e.clientX)
  const y = rand(e.clientY)

  switch (mode) {
    case CREATE_LOOP_MODE:
      addLoopPoint(x, y)

      break

    case CREATE_EDGE_MODE:
      addConstraintPoint(x, y)

      break

    default:
      return
  }

  render()
})

fg.addEventListener('contextmenu', (e) => {
  e.preventDefault()

  setCreateLoopEnabled(false)
  setCreateEdgeEnabled(false)
})

fg.addEventListener('mousedown', (e) => {
  if (mode !== BEGIN_MODE) {
    return
  }

  const x = e.clientX
  const y = e.clientY

  const pi = loopState.findPointNearby(x, y, VERT_SNAP_DIST)

  if (pi !== null) {
    mode = DRAG_POINT_MODE
    lpi = pi
  }
})

fg.addEventListener('mouseup', (e) => {
  if (mode !== DRAG_POINT_MODE) {
    return
  }

  if (lpi < 0) {
    return
  }

  const x = rand(e.clientX)
  const y = rand(e.clientY)

  loopState.updatePointPosition(lpi, x, y)

  lpi = -1
  mode = BEGIN_MODE

  render()
})
