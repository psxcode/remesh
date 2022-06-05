/* eslint-disable no-invalid-this */
import type { LoopState } from './LoopState'

export type SaveInit = {
  doc: Document,
  storage: Storage,
  ls: LoopState,
  reset: () => void,
  render: () => void,
}

export class Save {
  #data: { [id: string]: string } = {}
  #doc: Document
  #storage: Storage
  #ls: LoopState
  #doReset: () => void
  #doRender: () => void

  constructor({ doc, storage, ls, render, reset }: SaveInit) {
    this.#doc = doc
    this.#storage = storage
    this.#ls = ls
    this.#doReset = reset
    this.#doRender = render

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

  #saveAllData() {
    this.#storage.setItem('state', JSON.stringify(this.#data))
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
    delete this.#data[id]

    const items = document.querySelectorAll('.state-item')

    for (let i = 0; i < items.length; i++) {
      if (items[i].getAttribute('data-id') === id) {
        items[i].parentElement!.removeChild(items[i])
      }
    }

    this.#saveAllData()
  }

  #tryLoadAllData() {
    const data = localStorage.getItem('state')

    if (data === null) {
      return
    }

    try {
      this.#data = JSON.parse(data)
    } catch {
      console.error('Cannot parse data')
      console.error(data)

      return
    }

    const list = document.getElementById('state-list')!

    list.innerHTML = ''

    const storedIds = Object.keys(this.#data)

    for (let i = 0; i < storedIds.length; i++) {
      const el = this.#createStateElement(storedIds[i])

      list.appendChild(el)
    }

    if (storedIds.length > 0) {
      list.firstElementChild!.classList.add('active')
      this.#loadState(storedIds[0])
    }
  }

  #loadState(id: string) {
    const serState = this.#data[id]

    if (serState == null) {
      console.error(`No such id: ${id}`)
    }

    this.#doReset()

    this.#ls.deserialize(serState)

    this.#doRender()
  }

  #onAddState = () => {
    const id = this.#getRandomString()

    this.#doc.getElementById('state-list')?.appendChild(this.#createStateElement(id))
  }

  #onSaveState = () => {
    const activeItemId = this.#getActiveItemId()

    if (activeItemId === null) {
      console.error('No active id')

      return
    }

    this.#data[activeItemId] = this.#ls.serialize()

    this.#saveAllData()
  }

  #onLoadState = () => {
    const activeItemId = this.#getActiveItemId()

    if (activeItemId === null) {
      console.error('No active id')

      return
    }

    this.#loadState(activeItemId)
  }
}

