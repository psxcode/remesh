/* eslint-disable no-invalid-this */
import type { LoopState } from './LoopState'

export type SaveInit = {
  doc: Document,
  storage: Storage,
  ls: LoopState[],
  onLoadBegin: () => void,
  onLoad: (state: string) => void,
  onComplete: () => void,
}

export class Save {
  #doc: SaveInit['doc']
  #storage: SaveInit['storage']
  #ls: SaveInit['ls']
  #onLoadBeginCb: SaveInit['onLoadBegin']
  #onLoadCb: SaveInit['onLoad']
  #onCompleteCb: SaveInit['onComplete']

  constructor({ doc, storage, ls, onLoad, onLoadBegin, onComplete }: SaveInit) {
    this.#doc = doc
    this.#storage = storage
    this.#ls = ls
    this.#onLoadBeginCb = onLoadBegin
    this.#onLoadCb = onLoad
    this.#onCompleteCb = onComplete

    const saveStateBtn = this.#doc.getElementById('save-state')!
    const loadStateBtn = this.#doc.getElementById('load-state')!
    const addStateBtn = this.#doc.getElementById('add-state')!

    addStateBtn.addEventListener('click', this.#onAddState)
    saveStateBtn.addEventListener('click', this.#onSaveState)
    loadStateBtn.addEventListener('click', this.#onLoadState)
    this.#tryLoadAllData()
  }

  #getRandomString() {
    return Math.random().toString(36).substring(2, 6)
  }

  #clearActiveStates() {
    this.#doc.querySelectorAll('.state-item').forEach((n) => n.classList.remove('active'))
  }

  #getActiveItemId() {
    const items = this.#doc.querySelectorAll('.state-item')

    for (let i = 0; i < items.length; i++) {
      if (items[i].classList.contains('active')) {
        return items[i].getAttribute('data-id')
      }
    }

    return null
  }

  #createStateElement(id: string) {
    const templ = this.#doc.getElementById('state-template') as HTMLTemplateElement

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

      this.#clearActiveStates()
      el.classList.add('active')
    })

    close.addEventListener('click', () => {
      this.#removeStoredItem(id)
    })

    text.textContent = id

    return el
  }

  #removeStoredItem(id: string) {
    const items = document.querySelectorAll('.state-item')

    for (let i = 0; i < items.length; i++) {
      if (items[i].getAttribute('data-id') === id) {
        items[i].parentElement!.removeChild(items[i])
      }
    }
  }

  #tryLoadAllData() {
    const list = document.getElementById('state-list')!
    const numItems = this.#storage.length

    list.innerHTML = ''

    for (let i = 0; i < numItems; i++) {
      const id = this.#storage.key(i)

      if (id === null) {
        continue
      }

      const el = this.#createStateElement(id)

      list.appendChild(el)
    }

    list.firstElementChild?.classList.add('active')

    if (numItems === 0) {
      this.#onAddState()
    }

    this.#onLoadState()
  }

  #onAddState = () => {
    const id = this.#getRandomString()

    const list = this.#doc.getElementById('state-list')!

    list.appendChild(this.#createStateElement(id))
    list.lastElementChild!.classList.add('active')
  }

  #onSaveState = () => {
    const activeItemId = this.#getActiveItemId()

    if (activeItemId === null) {
      console.error('No active id')

      return
    }

    this.#storage.setItem(
      activeItemId,
      JSON.stringify(
        this.#ls.map((s) => s.serialize())
      )
    )
  }

  #onLoadState = () => {
    const activeItemId = this.#getActiveItemId()

    if (activeItemId === null) {
      console.error('No active id')

      return
    }

    if (activeItemId === null) {
      return
    }

    const data = this.#storage.getItem(activeItemId)

    if (data === null) {
      return
    }

    const serState = JSON.parse(data) as string[]

    this.#onLoadBeginCb()

    serState.forEach((s) => {
      this.#onLoadCb(s)
    })

    return this.#onCompleteCb()
  }
}

