import * as types from './type'
import { transition } from './const';

interface key_value {
  [key: string]: any
}

export class List {
  dom: HTMLElement
  options: types.options
  constructor(dom: HTMLElement, options: types.options) {
    this.dom = dom
    this.options = options
    this.dom.style.transition = transition
  }
  changeStyle(styles: key_value) {
    Object.keys(styles).map((styleKey: string) => (this.dom.style as key_value)[styleKey] = styles[styleKey])
  }
  zoomIn(from: types.rect, to: types.rect) {
    const { width: x1 } = from
    const { width: x2 } = to
    const n = this.options.urls.length
    const store = this.options.store
    const showIndex = store.get('showIndex')
    let leftOffset = showIndex * x1
    this.changeStyle({ width: n * x1 + 'px', left: -leftOffset + 'px' })
    window.requestAnimationFrame(() => {
      leftOffset = showIndex * x2
      this.changeStyle({ width: n * x2 + 'px', left: -leftOffset + 'px' })
    })
  }
  zoomOut(to: types.rect) {
    const { width: x1 } = to
    // const { width: x2, height: y2 } = from
    const n = this.options.urls.length
    const store = this.options.store
    const showIndex = store.get('showIndex')
    let leftOffset
    // let leftOffset = showIndex * x2
    // this.changeStyle({ width: n * x2 + 'px', height: n * y2 + 'px', left: -leftOffset + 'px' })
    window.requestAnimationFrame(() => {
      leftOffset = showIndex * x1
      this.changeStyle({ width: n * x1 + 'px', left: -leftOffset + 'px' })
    })
  }

  startX: number
  startLeft: number
  slideStart(e: TouchEvent) {
    const { clientX } = e.touches[0]
    this.startX = clientX
    this.startLeft = this.dom.offsetLeft
    this.dom.style.transition = 'none'
  }
  slide(e: TouchEvent) {
    const { clientX } = e.touches[0]
    const diffX = clientX - this.startX
    this.changeStyle({ left: `${this.startLeft + diffX}px` })
  }

  slideEnd() {
    const left = this.dom.offsetLeft
    const { options } = this
    const body_width = document.body.offsetWidth
    let showIndex = Math.round(-left / body_width)
    if (showIndex + 1 > options.targets.length) {//已滑到最右侧
      showIndex = options.targets.length - 1
    }
    if (showIndex < 0) {//已滑到最左侧
      showIndex = 0
    }
    const prevShowIndex = options.store.get('showIndex')
    if (prevShowIndex !== showIndex) {
      options.store.set('showIndex', showIndex)
    }
    this.changeStyle({ left: `-${showIndex * body_width}px`, transition })
  }
}