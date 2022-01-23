/* eslint-disable no-param-reassign */
import { drawEdges, drawLoop, drawPoints } from './draw'
import {
  findPointNearby,
  calcEdges,
  findEdgeNearby,
  projToLine,
  findLoopEdgeNearby,
  isPointInsideLoop,
  findIntersectionWithContraint,
  findIntersectionWithLoop,
  isExistingLoopEdge,
  isExistingEdge,
  isAnyPointNearbyNewEdge,
} from './math'

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

const bgCtx = bg.getContext('2d')!
const fgCtx = fg.getContext('2d')!
let mode = DEFAULT_MODE

const points: number[] = []
const edges: number[] = []
let pointsLength = 0
let lpi = -1

type TState = {
  points: number[],
  edges: number[],
  pointsLength: number,
}
let stored: { [id: string]: TState } = {}

const resetState = () => {
  points.length = 0
  edges.length = 0
  pointsLength = 0
  lpi = -1
}

const render = () => {
  fgCtx.clearRect(0, 0, WIDTH, HEIGHT)
  bgCtx.clearRect(0, 0, WIDTH, HEIGHT)
  drawPoints(bgCtx, points)

  if (points.length > 1) {
    drawLoop(bgCtx, points, pointsLength, mode !== CREATE_LOOP_MODE)
  }

  if (edges.length > 0) {
    drawEdges(bgCtx, points, edges)
  }
}

const renderInteractiveLine = (x0: number, y0: number) => {
  if (lpi < 0) {
    return
  }

  const x1 = points[lpi]
  const y1 = points[lpi + 1]

  fgCtx.clearRect(0, 0, WIDTH, HEIGHT)

  // fgCtx.save()
  fgCtx.strokeStyle = 'red'

  fgCtx.beginPath()
  fgCtx.moveTo(x0, y0)
  fgCtx.lineTo(x1, y1)
  fgCtx.stroke()

  // fgCtx.restore()
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
  const pin = findPointNearby(x, y, points, VERT_SNAP_DIST)

  if (pin !== null) {
    return
  }

  points.push(x, y)
  pointsLength += 2
}

const insertPointIntoContraintEdge = (x: number, y: number, edgeIndex: number): number => {
  const epi0 = edges[edgeIndex]
  const epi1 = edges[edgeIndex + 1]
  const epi2 = points.length

  points.push(x, y)
  edges.splice(edgeIndex, 2, epi0, epi2, epi2, epi1)

  return epi2
}

const insertPointIntoLoopEdge = (x: number, y: number, pointIndex: number): number => {
  const npi = pointIndex + 2

  points.splice(npi, 0, x, y)
  pointsLength += 2

  for (let i = 0; i < edges.length; i++) {
    if (edges[i] > pointIndex) {
      edges[i] += 2
    }
  }

  return npi
}

const addConstraintPoint = (x: number, y: number) => {
  // If first point
  if (lpi === -1) {
    // Try find point nearby
    {
      const pin = findPointNearby(x, y, points, VERT_SNAP_DIST)

      if (pin !== null) {
        lpi = pin

        return
      }
    }

    // Try to find edge nearby
    {
      const ein = findEdgeNearby(x, y, points, edges)

      if (ein !== null) {
        const epi0 = edges[ein]
        const epi1 = edges[ein + 1]
        const [px, py] = projToLine(x, y, points[epi0], points[epi0 + 1], points[epi1], points[epi1 + 1])

        if (isAnyPointNearbyNewEdge(px, py, lpi, null, points)) {
          return
        }

        const npi = insertPointIntoContraintEdge(px, py, ein)

        edges.push(lpi, npi)
        lpi = npi

        return
      }
    }

    // Try to find loop edge nearby
    {
      const ein = findLoopEdgeNearby(x, y, points, pointsLength)

      if (ein !== null) {
        const [px, py] = projToLine(x, y, points[ein], points[ein + 1], points[ein + 2], points[ein + 3])

        if (isAnyPointNearbyNewEdge(px, py, lpi, null, points)) {
          return
        }

        const npi = insertPointIntoLoopEdge(px, py, ein)

        edges.push(
          lpi > npi ? lpi + 2 : lpi,
          npi
        )
        lpi = npi

        return
      }
    }

    if (isPointInsideLoop(x, y, points, pointsLength)) {
      lpi = points.length
      points.push(x, y)
    }

    return
  }

  // debugger

  // Not first point
  // Find if intersecting existing constraints
  {
    const ix = findIntersectionWithContraint(x, y, lpi, points, pointsLength, edges)

    if (ix !== null) {
      const { point: [px, py], index } = ix
      const pin = findPointNearby(px, py, points, VERT_SNAP_DIST)

      if (pin !== null) {
        if (
          lpi === pin ||
          isExistingLoopEdge(lpi, pin, pointsLength) ||
          isExistingEdge(lpi, pin, edges) ||
          isAnyPointNearbyNewEdge(points[pin], points[pin + 1], lpi, pin, points)
        ) {
          return
        }

        edges.push(lpi, pin)
        lpi = pin

        return
      }

      if (
        edges[index] === lpi ||
        edges[index + 1] === lpi ||
        isAnyPointNearbyNewEdge(px, py, lpi, null, points)
      ) {
        return
      }

      const npi = insertPointIntoContraintEdge(px, py, index)

      edges.push(lpi, npi)
      lpi = npi

      return
    }
  }

  // Find if intersecting loop
  {
    const ix = findIntersectionWithLoop(x, y, lpi, points, pointsLength)

    if (ix !== null) {
      const { point: [px, py], index } = ix
      const pin = findPointNearby(px, py, points, VERT_SNAP_DIST)

      if (pin !== null) {
        if (
          lpi === pin ||
          isExistingLoopEdge(lpi, pin, pointsLength) ||
          isAnyPointNearbyNewEdge(points[pin], points[pin + 1], lpi, pin, points)
        ) {
          return
        }

        edges.push(lpi, pin)
        lpi = pin

        return
      }

      if (
        index === lpi ||
        (index + 2) % pointsLength === lpi ||
        isAnyPointNearbyNewEdge(px, py, lpi, null, points)
      ) {
        return
      }

      const npi = insertPointIntoLoopEdge(px, py, index)

      edges.push(
        lpi > npi ? lpi + 2 : lpi,
        npi
      )
      lpi = npi

      return
    }
  }

  // Find if point is nearby
  {
    const pin = findPointNearby(x, y, points, VERT_SNAP_DIST)

    if (pin !== null) {
      if (
        isExistingLoopEdge(lpi, pin, pointsLength) ||
        isExistingEdge(lpi, pin, edges) ||
        isAnyPointNearbyNewEdge(points[pin], points[pin + 1], lpi, pin, points)
      ) {
        return
      }

      edges.push(lpi, pin)
      lpi = pin

      return
    }
  }

  // Find if constraint edge is nearby
  {
    const ein = findEdgeNearby(x, y, points, edges)

    if (ein !== null) {
      const epi0 = edges[ein]
      const epi1 = edges[ein + 1]

      if (lpi === epi0 || lpi === epi1) {
        return
      }

      const [px, py] = projToLine(x, y, points[epi0], points[epi0 + 1], points[epi1], points[epi1 + 1])

      if (isAnyPointNearbyNewEdge(px, py, lpi, null, points)) {
        return
      }

      const npi = insertPointIntoContraintEdge(px, py, ein)

      edges.push(lpi, npi)
      lpi = npi

      return
    }
  }

  // Find if loop edge is nearby
  {
    const ein = findLoopEdgeNearby(x, y, points, pointsLength)

    if (ein !== null) {
      const [px, py] = projToLine(x, y, points[ein], points[ein + 1], points[ein + 2], points[ein + 3])

      if (isAnyPointNearbyNewEdge(px, py, lpi, null, points)) {
        return
      }

      const npi = insertPointIntoLoopEdge(px, py, ein)

      edges.push(
        lpi > npi ? lpi + 2 : lpi,
        npi
      )
      lpi = npi
    }
  }

  // Standalone point
  if (isPointInsideLoop(x, y, points, pointsLength)) {
    if (isAnyPointNearbyNewEdge(x, y, lpi, null, points)) {
      return
    }

    edges.push(lpi, points.length)
    lpi = points.length
    points.push(x, y)
  }
}

const setCreateEdgeEnabled = (isEnabled: boolean) => {
  if (isEnabled === (mode === CREATE_EDGE_MODE)) {
    return
  }

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

  lpi = -1

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
  const state = stored[id]

  if (state == null) {
    console.error(`No such id: ${id}`)
  }

  resetState()

  points.splice(0, points.length, ...state.points)
  edges.splice(0, edges.length, ...state.edges)
  pointsLength = state.pointsLength

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

  stored[id] = {
    points: [],
    edges: [],
    pointsLength: 0,
  }

  document.getElementById('state-list')?.appendChild(createStateElement(id))

  saveAllData()
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

  const state = stored[activeItemId]

  if (state == null) {
    console.error(`No such id: ${activeItemId}`)

    return
  }

  state.points = points.slice()
  state.edges = edges.slice()
  state.pointsLength = pointsLength

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
