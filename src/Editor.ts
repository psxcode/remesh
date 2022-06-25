/* eslint-disable no-invalid-this */
/* eslint-disable no-param-reassign */
import { LoopState } from './LoopState'
import { MeshState } from './MeshState'
import { Save } from './Save'
import { Draw } from './draw'

class ActiveLoop {
  private _loop: LoopState
  private _lpi: number | null = null
  private _x = 0
  private _y = 0
  private _cachedCoords = false

  constructor(initialLoop: LoopState) {
    this._loop = initialLoop
  }

  get loop(): LoopState {
    return this._loop
  }

  set loop(loop: LoopState) {
    this._loop = loop
    this._lpi = null
    this._cachedCoords = false
  }

  get lpi(): number | null {
    return this._lpi
  }

  set lpi(lpi: number | null) {
    if (this._loop === null) {
      throw new Error('No active loop')
    }

    if (lpi !== null && lpi < 0) {
      throw new Error('Lpi param is invalid')
    }

    this._lpi = lpi
    this._cachedCoords = false
  }

  get x() {
    if (!this._cachedCoords) {
      this.cacheCoords()
    }

    return this._x
  }

  get y() {
    if (!this._cachedCoords) {
      this.cacheCoords()
    }

    return this._y
  }

  private cacheCoords() {
    if (this._lpi === null) {
      throw new Error('Lpi is not set')
    }

    const pts = this.loop.pointsFlatArray
    const flatPi = this._lpi * LoopState.POINT_DATA_LENGTH

    this._x = pts[flatPi]
    this._y = pts[flatPi + 1]
    this._cachedCoords = true
  }
}

type EditorOptions = {
  width: number,
  height: number,
}

export class Editor {
  static readonly BEGIN_MODE = 0
  static readonly CREATE_LOOP_MODE = 1
  static readonly CREATE_EDGE_MODE = 3
  static readonly DRAG_POINT_MODE = 4
  private mode = Editor.BEGIN_MODE
  #loops: LoopState[]
  #mesh: MeshState

  activeLoop: ActiveLoop

  #bg: Draw
  #fg: Draw

  private snapDist = 8
  constructor({ width, height }: EditorOptions) {
    const bg = Editor.backgroundLayer
    const fg = Editor.foregroundLayer

    bg.width = width
    bg.height = height
    fg.width = width
    fg.height = height
    this.#bg = new Draw(bg.getContext('2d')!, width, height)
    this.#fg = new Draw(fg.getContext('2d')!, width, height)

    this.#mesh = new MeshState()
    this.#loops = [new LoopState()]
    this.activeLoop = new ActiveLoop(this.lastLoop)

    void new Save({
      doc: document,
      storage: localStorage,
      ls: this.#loops,
      onLoadBegin: this.resetState,
      onLoad: this.onLoadLoop,
      onComplete: this.onLoadComplete,
    })

    Editor.createLoopBtn.addEventListener('click', this.onToggleCreateLoop)
    Editor.createEdgeBtn.addEventListener('click', this.onToggleCreateEdge)
    Editor.createMeshBtn.addEventListener('click', this.onCreateMesh)
    Editor.resetBtn.addEventListener('click', this.resetState)

    Editor.viewLoopCheckbox.addEventListener('change', this.onCheckboxChange)
    Editor.viewBaseEdgesCheckbox.addEventListener('change', this.onCheckboxChange)
    Editor.viewCloudEdgesCheckbox.addEventListener('change', this.onCheckboxChange)
    Editor.viewTrisCheckbox.addEventListener('change', this.onCheckboxChange)
    Editor.prevLoop.addEventListener('click', this.onPrevActiveLoopClick)
    Editor.nextLoop.addEventListener('click', this.onNextActiveLoopClick)

    fg.addEventListener('click', this.onFgClick)
    fg.addEventListener('contextmenu', this.onFgRightClick)
    fg.addEventListener('mousedown', this.onFgMouseDown)
    fg.addEventListener('mouseup', this.onFgMouseUp)
  }

  static get resetBtn() {
    return document.getElementById('reset')!
  }

  static get createLoopBtn() {
    return document.getElementById('create-loop')!
  }

  static get createEdgeBtn() {
    return document.getElementById('create-edge')!
  }

  static get createMeshBtn() {
    return document.getElementById('create-pcloud')!
  }

  static get pcloudScale() {
    return document.getElementById('pcloud-scale')! as HTMLInputElement
  }

  static get viewLoopCheckbox() {
    return document.getElementById('view-loop')! as HTMLInputElement
  }

  static get viewBaseEdgesCheckbox() {
    return document.getElementById('view-base-edges')! as HTMLInputElement
  }

  static get viewCloudEdgesCheckbox() {
    return document.getElementById('view-cloud-edges')! as HTMLInputElement
  }

  static get viewTrisCheckbox() {
    return document.getElementById('view-tris')! as HTMLInputElement
  }

  static get foregroundLayer() {
    return document.getElementById('fg') as HTMLCanvasElement
  }

  static get backgroundLayer() {
    return document.getElementById('bg') as HTMLCanvasElement
  }

  static get nextLoop() {
    return document.getElementById('next-loop') as HTMLButtonElement
  }

  static get prevLoop() {
    return document.getElementById('prev-loop') as HTMLButtonElement
  }

  static rand(int: number) {
    return int + Math.random()
  }

  private get lastLoop() {
    if (this.#loops.length === 0) {
      throw new Error('No loops')
    }

    return this.#loops[this.#loops.length - 1]
  }

  private onLoadLoop = (data: string) => {
    if (this.lastLoop.numPoints !== 0) {
      this.#loops.push(new LoopState())
    }

    this.lastLoop.deserialize(data)
  }

  private onLoadComplete = () => {
    this.mode = Editor.BEGIN_MODE
    this.activeLoop.loop = this.lastLoop

    return this.render()
  }

  private resetState = () => {
    this.#loops.forEach((s) => s.clear())
    this.#loops.length = 1
    this.#mesh.clear()
    this.mode = Editor.BEGIN_MODE
    this.activeLoop.loop = this.lastLoop

    Editor.createLoopBtn.removeAttribute('disabled')
    Editor.createEdgeBtn.removeAttribute('disabled')
    Editor.createMeshBtn.removeAttribute('disabled')

    Editor.createLoopBtn.removeAttribute('active')
    Editor.createEdgeBtn.removeAttribute('active')

    this.render()
  }

  private render() {
    this.#fg.clear()
    this.#bg.clear()

      this.#bg.drawMesh(
        this.#mesh,
        Editor.viewBaseEdgesCheckbox.checked,
        Editor.viewCloudEdgesCheckbox.checked,
        Editor.viewTrisCheckbox.checked
      )

    this.#loops.forEach((s) => {
      if (Editor.viewLoopCheckbox.checked) {
        this.#bg.drawLoop(
          s,
          this.mode !== Editor.CREATE_LOOP_MODE,
          this.activeLoop.loop === s
        )
        this.#bg.drawEdges(s)
      }

      if (Editor.viewLoopCheckbox.checked) {
        this.#bg.drawPoints(s)
      }
    })
  }

  private renderInteractiveLine(x0: number, y0: number) {
    if (this.activeLoop.lpi === null) {
      return
    }

    const x1 = this.activeLoop.x
    const y1 = this.activeLoop.y

    this.#fg.clear()
    this.#fg.drawInteractiveLine(x0, y0, x1, y1)
  }

  private onCreateMesh = () => {
    const scale = Number(Editor.pcloudScale.value)

    if (!Number.isInteger(scale)) {
      return
    }

    if (this.#mesh === null) {
      this.#mesh = new MeshState()
    }

    this.#mesh.generate(this.activeLoop.loop, scale)

    this.render()
  }

  private onFgMouseMove = (e: MouseEvent) => {
    this.renderInteractiveLine(e.clientX, e.clientY)
  }

  private onToggleCreateEdge = () => {
    this.setCreateEdgeEnabled(this.mode === Editor.BEGIN_MODE)
  }

  private setCreateEdgeEnabled(isEnabled: boolean) {
    if (isEnabled === false && this.mode !== Editor.CREATE_EDGE_MODE) {
      return
    }

    this.activeLoop.lpi = null

    if (isEnabled) {
      this.#mesh.clear()
      this.mode = Editor.CREATE_EDGE_MODE
      Editor.createEdgeBtn.setAttribute('active', '')
      Editor.createLoopBtn.setAttribute('disabled', '')
      Editor.createMeshBtn.setAttribute('disabled', '')
      Editor.foregroundLayer.addEventListener('mousemove', this.onFgMouseMove)
    } else {
      this.mode = Editor.BEGIN_MODE
      Editor.createEdgeBtn.removeAttribute('active')
      Editor.createLoopBtn.removeAttribute('disabled')
      Editor.createMeshBtn.removeAttribute('disabled')
      Editor.foregroundLayer.removeEventListener('mousemove', this.onFgMouseMove)
    }

    this.render()
  }

  private onToggleCreateLoop = () => {
    this.setCreateLoopEnabled(this.mode === Editor.BEGIN_MODE)
  }

  private setCreateLoopEnabled(isEnabled: boolean) {
    if (isEnabled === false && this.mode !== Editor.CREATE_LOOP_MODE) {
      return
    }

    const activeLoop = this.activeLoop.loop

    this.activeLoop.lpi = null

    if (isEnabled) {
      const isInnerLoop = activeLoop.numPoints > 0

      this.#mesh.clear()

      if (isInnerLoop) {
        activeLoop.clearEdges()
        activeLoop.beginInnerLoop()
      } else {
        activeLoop.clear()
      }

      this.mode = Editor.CREATE_LOOP_MODE
      Editor.createLoopBtn.setAttribute('active', '')
      Editor.createEdgeBtn.setAttribute('disabled', '')
      Editor.createMeshBtn.setAttribute('disabled', '')
      Editor.foregroundLayer.addEventListener('mousemove', this.onFgMouseMove)
    } else {
      if (activeLoop.numLastLoopPoints <= 2) {
        activeLoop.clearLastLoop()
      }

      this.mode = Editor.BEGIN_MODE
      Editor.createLoopBtn.removeAttribute('active')
      Editor.createEdgeBtn.removeAttribute('disabled')
      Editor.createMeshBtn.removeAttribute('disabled')
      Editor.foregroundLayer.removeEventListener('mousemove', this.onFgMouseMove)
    }

    this.render()
  }

  private addLoopPoint(x: number, y: number) {
    const nextPointIndex = this.activeLoop.loop.addLoopPoint(x, y, this.activeLoop.lpi, this.snapDist)

    if (nextPointIndex !== null) {
      this.activeLoop.lpi = nextPointIndex
    }
  }

  private addConstraintPoint(x: number, y: number) {
    const nextPointIndex = this.activeLoop.loop.addConstraintPoint(x, y, this.activeLoop.lpi, this.snapDist)

    if (nextPointIndex !== null) {
      this.activeLoop.lpi = nextPointIndex
    }
  }

  private onFgMouseDown = (e: MouseEvent) => {
    if (this.mode !== Editor.BEGIN_MODE) {
      return
    }

    const x = e.clientX
    const y = e.clientY

    const pi = this.activeLoop.loop.findPointNearby(x, y, this.snapDist)

    if (pi !== null) {
      this.mode = Editor.DRAG_POINT_MODE
      this.activeLoop.lpi = pi
    }
  }

  private onFgMouseUp = (e: MouseEvent) => {
    if (this.mode !== Editor.DRAG_POINT_MODE) {
      return
    }

    if (this.activeLoop.lpi === null) {
      return
    }

    const x = Editor.rand(e.clientX)
    const y = Editor.rand(e.clientY)

    this.activeLoop.loop.updatePointPosition(this.activeLoop.lpi, x, y)
    this.activeLoop.lpi = null
    this.mode = Editor.BEGIN_MODE

    this.render()
  }

  private onCheckboxChange = () => {
    this.render()
  }

  private onFgClick = (e: MouseEvent) => {
    switch (this.mode) {
      case Editor.CREATE_LOOP_MODE:
        this.addLoopPoint(
          Editor.rand(e.clientX),
          Editor.rand(e.clientY)
        )
        this.render()

        break

      case Editor.CREATE_EDGE_MODE:
        this.addConstraintPoint(
          Editor.rand(e.clientX),
          Editor.rand(e.clientY)
        )
        this.render()

        break

      default:
    }
  }

  private onFgRightClick = (e: Event) => {
    e.preventDefault()

    this.setCreateLoopEnabled(false)
    this.setCreateEdgeEnabled(false)
  }

  private onNextActiveLoopClick = () => {
    const i = this.#loops.indexOf(this.activeLoop.loop)

    if (i < 0) {
      throw new Error('Cannot find index of the active loop')
    }

    // Dont create new loop if last one is still empty
    if (this.#loops[i].numPoints === 0) {
      return
    }

    const nextIndex = i + 1

    if (nextIndex === this.#loops.length) {
      this.#loops.push(new LoopState())
    }

    this.activeLoop.loop = this.#loops[nextIndex]

    this.render()
  }

  private onPrevActiveLoopClick = () => {
    const i = this.#loops.indexOf(this.activeLoop.loop)

    if (i < 0) {
      throw new Error('Cannot find index of the active loop')
    }

    const prevIndex = Math.max(i - 1, 0)

    this.activeLoop.loop = this.#loops[prevIndex]

    this.render()
  }
}
