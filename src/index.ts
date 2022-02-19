/* eslint-disable no-param-reassign */
import { LoopState } from './LoopState'
import { MeshState } from './MeshState'
import { Draw } from './draw'

const WIDTH = 640
const HEIGHT = 480
const VERT_SNAP_DIST = 8
const rand = (int: number) => int + Math.random()

const resetBtn = document.getElementById('reset')!
const createLoopBtn = document.getElementById('create-loop')!
const createEdgeBtn = document.getElementById('create-edge')!
const createPCloudBtn = document.getElementById('create-pcloud')!
const saveStateBtn = document.getElementById('save-state')!
const loadStateBtn = document.getElementById('load-state')!
const addStateBtn = document.getElementById('add-state')!
const pcloudScale = document.getElementById('pcloud-scale')! as HTMLInputElement
const viewLoopCheckbox = document.getElementById('view-loop')! as HTMLInputElement
const viewEdgesCheckbox = document.getElementById('view-edges')! as HTMLInputElement
const bg = document.getElementById('bg') as HTMLCanvasElement
const fg = document.getElementById('fg') as HTMLCanvasElement

bg.width = WIDTH
bg.height = HEIGHT
fg.width = WIDTH
fg.height = HEIGHT

const BEGIN_MODE = 0
const CREATE_LOOP_MODE = 1
const CREATE_INNER_LOOP_MODE = 2
const CREATE_EDGE_MODE = 3
const DRAG_POINT_MODE = 4

const drawBg = new Draw(bg.getContext('2d')!)
const drawFg = new Draw(fg.getContext('2d')!)
let mode = BEGIN_MODE

const loopState = new LoopState()
const meshState = new MeshState(loopState)
let lpi = -1

let stored: { [id: string]: string } = {}

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

// const printPoint = (ptIndex: number) => {
//   return `pt: ${ptIndex}`
// }

// const printLoopEdge = (ptIndex: number) => {
//   return `${ptIndex}->${state.wrapLoopPointIndex(ptIndex, 1)}`
// }

// const printEdge = (edgeIndex: number) => {
//   const ei = edgeIndex * 2
//   const edges = state.edgesFlatArray

//   return `edge: ${edgeIndex}, ${edges[ei] / 2}->${(edges[ei + 1]) / 2}`
// }

const render = () => {
  drawFg.clearRect(0, 0, WIDTH, HEIGHT)
  drawBg.clearRect(0, 0, WIDTH, HEIGHT)

  if (viewLoopCheckbox.checked) {
    drawBg.drawLoop(loopState, mode !== CREATE_LOOP_MODE && mode !== CREATE_INNER_LOOP_MODE)
  }

  if (viewEdgesCheckbox.checked) {
    drawBg.drawEdges(loopState)
  }

  drawBg.drawPCloud(meshState)
  drawBg.drawPoints(loopState)
}

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
  const pin = loopState.findPointNearby(x, y, VERT_SNAP_DIST)

  if (pin !== null) {
    return
  }

  if (mode === CREATE_INNER_LOOP_MODE) {
    if (!loopState.isNewLoopPointInsideOtherLoops(x, y)) {
      // console.log('OUTSIDE')

      return
    }

    if (loopState.doesNewLoopEdgeIntersectOtherLoops(x, y, lpi)) {
      // console.log('INTERSECT')

      return
    }
  }

  lpi = loopState.addLoopPoint(x, y)
}

const addConstraintPoint = (x: number, y: number) => {
  // If first point
  if (lpi === -1) {
    // console.log('FIRST_POINT')

    // Try find point nearby
    {
      const pin = loopState.findPointNearby(x, y, VERT_SNAP_DIST)

      if (pin !== null) {
        // console.log('  POINT_NEARBY', printPoint(pin))
        lpi = pin

        return
      }
    }

    // Try to find edge nearby
    {
      const ein = loopState.findEdgeNearby(x, y)

      if (ein !== null) {
        // console.log('  EDGE_NEARBY', printEdge(ein))

        const [px, py] = loopState.projToEdge(x, y, ein)

        if (loopState.isAnyPointNearbyNewEdge(px, py, lpi)) {
          // console.log('    BAD_EDGE')

          return
        }

        lpi = loopState.insertPointIntoEdge(px, py, ein)

        return
      }
    }

    // Try to find loop edge nearby
    {
      const ein = loopState.findLoopEdgeNearby(x, y)

      if (ein !== null) {
        // console.log('  LOOP_NEARBY', printLoopEdge(ein))

        const [px, py] = loopState.projToLoop(x, y, ein)

        if (loopState.isAnyPointNearbyNewEdge(px, py, lpi)) {
          // console.log('    BAD_EDGE')

          return
        }

        lpi = loopState.insertPointIntoLoop(px, py, ein)

        return
      }
    }

    if (loopState.isPointInsideAllLoops(x, y)) {
      // console.log('  GOOD_POINT')
      lpi = loopState.addEdgePoint(x, y)

      return
    }

    // console.log('  OUTSIDE_LOOP')

    return
  }

  // Not first point
  // Find if intersecting existing constraints
  // console.log('NEXT_POINT')

  {
    const ix = loopState.findIntersectionWithEdge(x, y, lpi)

    if (ix !== null) {
      // console.log('  EDGE_INTERSECT', printEdge(ix.index))

      const { point: [px, py], index } = ix
      const pin = loopState.findPointNearbyOnEdge(px, py, index, VERT_SNAP_DIST)

      if (pin !== null) {
        // console.log('    POINT_NEARBY', printPoint(pin))

        if (
          lpi === pin ||
          loopState.isExistingEdge(lpi, pin) ||
          loopState.isExistingLoopEdge(lpi, pin) ||
          loopState.isAnyPointNearbyEdge(lpi, pin)
        ) {
          // console.log('      BAD_EDGE')

          return
        }

        loopState.addEdge(lpi, pin)
        lpi = pin

        return
      }

      if (
        loopState.isAnyPointNearbyNewEdge(px, py, lpi)
      ) {
        // console.log('    BAD_EDGE')

        return
      }

      const npi = loopState.insertPointIntoEdge(px, py, index)

      loopState.addEdge(lpi, npi)
      lpi = npi

      return
    }
  }

  // Find if intersecting loop
  {
    const ix = loopState.findIntersectionWithLoop(x, y, lpi)

    if (ix !== null) {
      // console.log('  INTERSECT_LOOP', printLoopEdge(ix.index))

      const { point: [px, py], index } = ix
      const pin = loopState.findPointNearbyOnLoop(px, py, index, VERT_SNAP_DIST)

      if (pin !== null) {
        // console.log('    POINT_NEARBY', printPoint(pin))

        if (
          lpi === pin ||
          loopState.isExistingEdge(lpi, pin) ||
          loopState.isExistingLoopEdge(lpi, pin) ||
          loopState.isAnyPointNearbyEdge(lpi, pin)
        ) {
          // console.log('      BAD_EDGE')

          return
        }

        loopState.addEdge(lpi, pin)
        lpi = pin

        return
      }

      if (
        loopState.isAnyPointNearbyNewEdge(px, py, lpi)
      ) {
        // console.log('    BAD_EDGE')

        return
      }

      const npi = loopState.insertPointIntoLoop(px, py, index)

      loopState.addEdge(
        lpi >= npi ? lpi + 1 : lpi,
        npi
      )
      lpi = npi

      return
    }
  }

  // Find if point is nearby
  {
    const pin = loopState.findPointNearby(x, y, VERT_SNAP_DIST)

    if (pin !== null) {
      // console.log('  POINT_NEARBY', printPoint(pin))

      if (
        lpi === pin ||
        loopState.isExistingLoopEdge(lpi, pin) ||
        loopState.isExistingEdge(lpi, pin) ||
        loopState.isAnyPointNearbyEdge(lpi, pin)
      ) {
        // console.log('    BAD_EDGE')

        return
      }

      loopState.addEdge(lpi, pin)
      lpi = pin

      return
    }
  }

  // Find if constraint edge is nearby
  {
    const ein = loopState.findEdgeNearby(x, y)

    if (ein !== null) {
      // console.log('  EDGE_NEARBY', printEdge(ein))

      if (loopState.doesPointBelongToEdge(ein, lpi)) {
        // console.log('    SAME_EDGE')

        return
      }

      const [px, py] = loopState.projToEdge(x, y, ein)
      const pin = loopState.findPointNearbyOnEdge(px, py, ein, VERT_SNAP_DIST)

      if (pin !== null) {
        // console.log('    POINT_NEARBY', printPoint(pin))

        if (
          lpi === pin ||
          loopState.isExistingLoopEdge(lpi, pin) ||
          loopState.isExistingEdge(lpi, pin) ||
          loopState.isAnyPointNearbyEdge(lpi, pin)
        ) {
          // console.log('      BAD_EDGE')

          return
        }

        loopState.addEdge(lpi, pin)
        lpi = pin

        return
      }

      if (loopState.isAnyPointNearbyNewEdge(px, py, lpi)) {
        // console.log('    BAD_EDGE')

        return
      }

      const npi = loopState.insertPointIntoEdge(px, py, ein)

      loopState.addEdge(lpi, npi)
      lpi = npi

      return
    }
  }

  // Find if loop edge is nearby
  {
    const ein = loopState.findLoopEdgeNearby(x, y)

    if (ein !== null) {
      // console.log('  LOOP_NEARBY', printLoopEdge(ein))

      const [px, py] = loopState.projToLoop(x, y, ein)
      const pin = loopState.findPointNearbyOnLoop(px, py, ein, VERT_SNAP_DIST)

      if (pin !== null) {
        // console.log('    POINT_NEARBY', printPoint(pin))

        if (
          lpi === pin ||
          loopState.isExistingEdge(lpi, pin) ||
          loopState.isExistingLoopEdge(lpi, pin) ||
          loopState.isAnyPointNearbyEdge(lpi, pin)
        ) {
          // console.log('      BAD_EDGE')

          return
        }

        loopState.addEdge(lpi, pin)
        lpi = pin

        return
      }

      if (loopState.isAnyPointNearbyNewEdge(px, py, lpi)) {
        // console.log('    BAD_EDGE')

        return
      }

      const npi = loopState.insertPointIntoLoop(px, py, ein)

      loopState.addEdge(
        lpi >= npi ? lpi + 1 : lpi,
        npi
      )
      lpi = npi

      return
    }
  }

  // Standalone point
  if (loopState.isPointInsideAllLoops(x, y)) {
    // console.log('  GOOD_POINT')

    if (loopState.isAnyPointNearbyNewEdge(x, y, lpi)) {
      // console.log('    BAD_EDGE')

      return
    }

    loopState.addEdge(lpi, loopState.numPoints)
    lpi = loopState.addEdgePoint(x, y)

    return
  }

  // console.log('  OUTSIDE_LOOP')

  void 0
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
  if (isEnabled === false && mode !== CREATE_LOOP_MODE && mode !== CREATE_INNER_LOOP_MODE) {
    return
  }

  if (isEnabled) {
    const isInnerLoop = loopState.numPoints > 0

    if (isInnerLoop) {
      meshState.clear()
      loopState.clearEdges()
      loopState.beginInnerLoop()
    } else {
      meshState.clear()
      loopState.clear()
    }

    mode = isInnerLoop ? CREATE_INNER_LOOP_MODE : CREATE_LOOP_MODE
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

viewEdgesCheckbox.addEventListener('change', render)
viewLoopCheckbox.addEventListener('change', render)

fg.addEventListener('click', (e) => {
  const x = rand(e.clientX)
  const y = rand(e.clientY)

  switch (mode) {
    case CREATE_LOOP_MODE:
    case CREATE_INNER_LOOP_MODE:
      addLoopPoint(x, y)

      break

    case CREATE_EDGE_MODE:
      addConstraintPoint(x, y)

      loopState.validate()

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

  mode = DRAG_POINT_MODE

  const x = e.clientX
  const y = e.clientY

  const pi = loopState.findPointNearby(x, y, VERT_SNAP_DIST)

  if (pi !== null) {
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

const clearActiveStates = () => {
  document.querySelectorAll('.state-item').forEach((n) => n.classList.remove('active'))
}

const saveAllData = () => {
  localStorage.setItem('state', JSON.stringify(stored))
}

const loadState = (id: string) => {
  const serState = stored[id]

  if (serState == null) {
    console.error(`No such id: ${id}`)
  }

  resetState()

  loopState.deserialize(serState)

  render()
}

const removeStoredItem = (id: string) => {
  delete stored[id]

  const items = document.querySelectorAll('.state-item')

  for (let i = 0; i < items.length; i++) {
    if (items[i].getAttribute('data-id') === id) {
      items[i].parentElement!.removeChild(items[i])
    }
  }

  saveAllData()
}

const createStateElement = (id: string) => {
  const templ = document.getElementById('state-template') as HTMLTemplateElement

  const el = templ.content.cloneNode(true) as Element
  const item = el.querySelector('li')!
  const text = el.querySelector('span')!
  const close = el.querySelector('button')!

  item.setAttribute('data-id', id)
  item.addEventListener('click', (e) => {
    const el = e.target as Element

    if (el.tagName !== 'LI') {
      return
    }

    clearActiveStates()
    el.classList.add('active')
  })

  close.addEventListener('click', () => {
    removeStoredItem(id)
  })

  text.textContent = id

  return el
}

const tryLoadAllData = () => {
  const data = localStorage.getItem('state')

  if (data === null) {
    return
  }

  try {
    stored = JSON.parse(data)
  } catch {
    console.error('Cannot parse data')
    console.error(data)

    return
  }

  const list = document.getElementById('state-list')!

  list.innerHTML = ''

  const storedIds = Object.keys(stored)

  for (let i = 0; i < storedIds.length; i++) {
    const el = createStateElement(storedIds[i])

    list.appendChild(el)
  }

  if (storedIds.length > 0) {
    list.firstElementChild!.classList.add('active')
    loadState(storedIds[0])
  }
}

const getRandomString = () => {
  return Math.random().toString(36).substring(2, 6)
}

addStateBtn.addEventListener('click', () => {
  const id = getRandomString()

  document.getElementById('state-list')?.appendChild(createStateElement(id))
})

const getActiveItemId = () => {
  const items = document.querySelectorAll('.state-item')

  for (let i = 0; i < items.length; i++) {
    if (items[i].classList.contains('active')) {
      return items[i].getAttribute('data-id')
    }
  }

  return null
}

saveStateBtn.addEventListener('click', () => {
  const activeItemId = getActiveItemId()

  if (activeItemId === null) {
    console.error('No active id')

    return
  }

  stored[activeItemId] = loopState.serialize()

  saveAllData()
})

loadStateBtn.addEventListener('click', () => {
  const activeItemId = getActiveItemId()

  if (activeItemId === null) {
    console.error('No active id')

    return
  }

  loadState(activeItemId)
})

tryLoadAllData()
