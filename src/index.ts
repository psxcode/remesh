/* eslint-disable no-param-reassign */
import { Draw } from './draw'
import { Points } from './math'

const WIDTH = 640
const HEIGHT = 480
const VERT_SNAP_DIST = 16
const rand = (int: number) => int + Math.random()

const createLoopBtn = document.getElementById('create-loop')!
const createEdgeBtn = document.getElementById('create-edge')!
const saveStateBtn = document.getElementById('save-state')!
const loadStateBtn = document.getElementById('load-state')!
const addStateBtn = document.getElementById('add-state')!
const bg = document.getElementById('bg') as HTMLCanvasElement
const fg = document.getElementById('fg') as HTMLCanvasElement

bg.width = WIDTH
bg.height = HEIGHT
fg.width = WIDTH
fg.height = HEIGHT

const DEFAULT_MODE = 0
const CREATE_LOOP_MODE = 1
const CREATE_EDGE_MODE = 2

const drawBg = new Draw(bg.getContext('2d')!)
const drawFg = new Draw(fg.getContext('2d')!)
let mode = DEFAULT_MODE

const state: Points = new Points()
let lpi = -1

let stored: { [id: string]: string } = {}

const resetState = () => {
  state.reset()
  lpi = -1
}

const printPoint = (ptIndex: number) => {
  return `pt: ${ptIndex}`
}

const printLoopEdge = (ptIndex: number) => {
  return `${ptIndex}->${(ptIndex + 1) % state.numLoopPoints}`
}

const printEdge = (edgeIndex: number) => {
  const ei = edgeIndex * 2
  const edges = state.edgesFlatArray

  return `edge: ${edgeIndex}, ${edges[ei] / 2}->${(edges[ei + 1]) / 2}`
}

const render = () => {
  drawFg.clearRect(0, 0, WIDTH, HEIGHT)
  drawBg.clearRect(0, 0, WIDTH, HEIGHT)

  drawBg.drawLoop(state, mode !== CREATE_LOOP_MODE)
  drawBg.drawEdges(state)
  drawBg.drawPoints(state)
}

const renderInteractiveLine = (x0: number, y0: number) => {
  if (lpi < 0) {
    return
  }

  const points = state.pointsFlatArray
  const x1 = points[lpi]
  const y1 = points[lpi + 1]

  drawFg.clearRect(0, 0, WIDTH, HEIGHT)
  drawFg.drawInteractiveLine(x0, y0, x1, y1)
}

const handleMouseMove = (e: MouseEvent) => {
  renderInteractiveLine(e.clientX, e.clientY)
}

const recalc = () => {
  // if (points.length > 3) {
  //   edges.length = 0
  //   edges.push(...calcEdges(points))
  // }
}

const addLoopPoint = (x: number, y: number) => {
  const pin = state.findPointNearby(x, y, VERT_SNAP_DIST)

  if (pin !== null) {
    return
  }

  state.addLoopPoint(x, y)
}

const addConstraintPoint = (x: number, y: number) => {
  // If first point
  if (lpi === -1) {
    console.log('FIRST_POINT')

    // Try find point nearby
    {
      const pin = state.findPointNearby(x, y, VERT_SNAP_DIST)

      if (pin !== null) {
        console.log('  POINT_NEARBY', printPoint(pin))
        lpi = pin

        return
      }
    }

    // Try to find edge nearby
    {
      const ein = state.findEdgeNearby(x, y)

      if (ein !== null) {
        console.log('  EDGE_NEARBY', printEdge(ein))

        const [px, py] = state.projToEdge(x, y, ein)

        if (state.isAnyPointNearbyNewEdge(px, py, lpi)) {
          console.log('    BAD_EDGE')

          return
        }

        lpi = state.insertPointIntoEdge(px, py, ein)

        return
      }
    }

    // Try to find loop edge nearby
    {
      const ein = state.findLoopEdgeNearby(x, y)

      if (ein !== null) {
        console.log('  LOOP_NEARBY', printLoopEdge(ein))

        const [px, py] = state.projToLoop(x, y, ein)

        if (state.isAnyPointNearbyNewEdge(px, py, lpi)) {
          console.log('    BAD_EDGE')

          return
        }

        lpi = state.insertPointIntoLoop(px, py, ein)

        return
      }
    }

    if (state.isPointInsideLoop(x, y)) {
      console.log('  GOOD_POINT')
      lpi = state.numPoints
      state.addPoint(x, y)

      return
    }

    console.log('  OUTSIDE_LOOP')

    return
  }

  // Not first point
  // Find if intersecting existing constraints
  console.log('NEXT_POINT')

  {
    const ix = state.findIntersectionWithEdge(x, y, lpi)

    if (ix !== null) {
      console.log('  EDGE_INTERSECT', printEdge(ix.index))

      const { point: [px, py], index } = ix
      const pin = state.findPointNearby(px, py, VERT_SNAP_DIST)

      if (pin !== null) {
        console.log('    POINT_NEARBY', printPoint(pin))

        if (
          state.isExistingEdge(lpi, pin) ||
          state.isExistingLoopEdge(lpi, pin) ||
          state.isAnyPointNearbyEdge(lpi, pin)
        ) {
          console.log('      BAD_EDGE')

          return
        }

        state.addEdge(lpi, pin)
        lpi = pin

        return
      }

      if (
        state.isAnyPointNearbyNewEdge(px, py, lpi)
      ) {
        console.log('    BAD_EDGE')

        return
      }

      const npi = state.insertPointIntoEdge(px, py, index)

      state.addEdge(lpi, npi)
      lpi = npi

      return
    }
  }

  // Find if intersecting loop
  {
    const ix = state.findIntersectionWithLoop(x, y, lpi)

    if (ix !== null) {
      console.log('  INTERSECT_LOOP', printLoopEdge(ix.index))

      const { point: [px, py], index } = ix
      const pin = state.findPointNearby(px, py, VERT_SNAP_DIST)

      if (pin !== null) {
        console.log('    POINT_NEARBY', printPoint(pin))

        if (
          state.isExistingEdge(lpi, pin) ||
          state.isExistingLoopEdge(lpi, pin) ||
          state.isAnyPointNearbyEdge(lpi, pin)
        ) {
          console.log('      BAD_EDGE')

          return
        }

        state.addEdge(lpi, pin)
        lpi = pin

        return
      }

      if (
        state.isAnyPointNearbyNewEdge(px, py, lpi)
      ) {
        console.log('    BAD_EDGE')

        return
      }

      const npi = state.insertPointIntoLoop(px, py, index)

      state.addEdge(
        lpi > npi ? lpi + 1 : lpi,
        npi
      )
      lpi = npi

      return
    }
  }

  // Find if point is nearby
  {
    const pin = state.findPointNearby(x, y, VERT_SNAP_DIST)

    if (pin !== null) {
      console.log('  POINT_NEARBY', printPoint(pin))

      if (
        state.isExistingLoopEdge(lpi, pin) ||
        state.isExistingEdge(lpi, pin) ||
        state.isAnyPointNearbyEdge(lpi, pin)
      ) {
        console.log('    BAD_EDGE')

        return
      }

      state.addEdge(lpi, pin)
      lpi = pin

      return
    }
  }

  // Find if constraint edge is nearby
  {
    const ein = state.findEdgeNearby(x, y)

    if (ein !== null) {
      console.log('  EDGE_NEARBY', printEdge(ein))

      const [epi0, epi1] = state.getEdgePointIndexes(ein)

      if (lpi === epi0 || lpi === epi1) {
        console.log('    SAME_EDGE')

        return
      }

      const [px, py] = state.projToEdge(x, y, ein)
      const pin = state.findPointNearby(px, py, VERT_SNAP_DIST)

      if (pin !== null) {
        console.log('    POINT_NEARBY', printPoint(pin))

        if (
          lpi === pin ||
          state.isExistingLoopEdge(lpi, pin) ||
          state.isExistingEdge(lpi, pin) ||
          state.isAnyPointNearbyEdge(lpi, pin)
        ) {
          console.log('      BAD_EDGE')

          return
        }

        state.addEdge(lpi, pin)
        lpi = pin

        return
      }

      if (state.isAnyPointNearbyNewEdge(px, py, lpi)) {
        console.log('    BAD_EDGE')

        return
      }

      const npi = state.insertPointIntoEdge(px, py, ein)

      state.addEdge(lpi, npi)
      lpi = npi

      return
    }
  }

  // Find if loop edge is nearby
  {
    const ein = state.findLoopEdgeNearby(x, y)

    if (ein !== null) {
      console.log('  LOOP_NEARBY', printLoopEdge(ein))

      const [px, py] = state.projToLoop(x, y, ein)
      const pin = state.findPointNearby(px, py, VERT_SNAP_DIST)

      if (pin !== null) {
        console.log('    POINT_NEARBY', printPoint(pin))

        if (
          lpi === pin ||
          state.isExistingEdge(lpi, pin) ||
          state.isExistingLoopEdge(lpi, pin) ||
          state.isAnyPointNearbyEdge(lpi, pin)
        ) {
          console.log('      BAD_EDGE')

          return
        }

        state.addEdge(lpi, pin)
        lpi = pin

        return
      }

      if (state.isAnyPointNearbyNewEdge(px, py, lpi)) {
        console.log('    BAD_EDGE')

        return
      }

      const npi = state.insertPointIntoLoop(px, py, ein)

      state.addEdge(
        lpi > npi ? lpi + 1 : lpi,
        npi
      )
      lpi = npi

      return
    }
  }

  // Standalone point
  if (state.isPointInsideLoop(x, y)) {
    console.log('  GOOD_POINT')

    if (state.isAnyPointNearbyNewEdge(x, y, lpi)) {
      console.log('    BAD_EDGE')

      return
    }

    state.addEdge(lpi, state.numPoints)
    lpi = state.numPoints
    state.addPoint(x, y)

    return
  }

  console.log('  OUTSIDE_LOOP')
}

const setCreateEdgeEnabled = (isEnabled: boolean) => {
  if (isEnabled === (mode === CREATE_EDGE_MODE)) {
    return
  }

  lpi = -1

  if (isEnabled) {
    mode = CREATE_EDGE_MODE
    createEdgeBtn.setAttribute('active', '')
    createLoopBtn.setAttribute('disabled', '')
    fg.addEventListener('mousemove', handleMouseMove)
  } else {
    mode = DEFAULT_MODE
    createEdgeBtn.removeAttribute('active')
    createLoopBtn.removeAttribute('disabled')
    fg.removeEventListener('mousemove', handleMouseMove)
  }

  render()
}

const setCreateLoopEnabled = (isEnabled: boolean) => {
  if (isEnabled === (mode === CREATE_LOOP_MODE)) {
    return
  }

  if (isEnabled) {
    mode = CREATE_LOOP_MODE
    resetState()
    createLoopBtn.setAttribute('active', '')
    createEdgeBtn.setAttribute('disabled', '')
  } else {
    mode = DEFAULT_MODE
    createLoopBtn.removeAttribute('active')
    createEdgeBtn.removeAttribute('disabled')
  }

  render()
}

createLoopBtn.addEventListener('click', () => {
  setCreateLoopEnabled(mode === DEFAULT_MODE)
})

createEdgeBtn.addEventListener('click', () => {
  setCreateEdgeEnabled(mode === DEFAULT_MODE)
})

fg.addEventListener('click', (e) => {
  const x = rand(e.clientX)
  const y = rand(e.clientY)

  switch (mode) {
    case CREATE_LOOP_MODE:
      addLoopPoint(x, y)

      break

    case CREATE_EDGE_MODE:
      addConstraintPoint(x, y)

      state.validate()

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

  state.deserialize(serState)

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

  stored[activeItemId] = state.serialize()

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
