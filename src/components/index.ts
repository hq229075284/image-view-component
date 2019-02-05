import * as types from './type'
import { Border } from './border'
import { List } from './list'
import { Item } from './item'
import { Store } from './store'
import { createRoot } from './dom'
export class Adapter {
  options: types.options
  root: HTMLElement
  borderInstance: Border
  listInstance: List
  itemInstances: Item[]
  constructor(options: types.options) {
    this.options = { ...options, store: new Store() }
  }
  getImgSize(url: string) {
    return new Promise((resolve) => {
      const m = new Image()
      m.src = url
      m.onload = function (e) {
        resolve({ width: m.width, height: m.height })
      }
    })
  }
  show(showIndex: number) {
    const { store } = this.options
    store.set('showIndex', showIndex)

    const _show = () => {
      const from = this.options.targets[showIndex].getClientRects()[0]
      const to = document.body.getClientRects()[0]
      this.borderInstance.zoomIn(from, to)
      this.listInstance.zoomIn(from, to)
      this.itemInstances.forEach(instance => instance.zoomIn(from, to))
    }

    if (!this.root) {
      this.root = createRoot(this.options)
      this.borderInstance = new Border(this.root.querySelector('.outer-scope'), this.options)
      this.listInstance = new List(this.root.querySelector('.list'), this.options)
      this.itemInstances = this.options.urls.map((u, i) => {
        return new Item(this.root.querySelectorAll('.inner-scope')[i] as HTMLElement, this.options, i)
      })
      Promise.all(this.options.urls.map(this.getImgSize))
        .then((infos: types.rect[]) => this.options.imgInfos = infos)
        .then(_show)
      this.root.addEventListener('touchstart', this.touchstart)
      this.root.addEventListener('touchmove', this.touchmove)
      this.root.addEventListener('touchend', this.touchend)
    } else {
      _show()
    }
  }
  isZoom = false
  isSlide = false
  isAction = () => this.isZoom || this.isSlide
  startX: number
  startY: number
  touchstart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      // const { thresholdX, thresholdY } = this.options
      const { clientX, clientY } = e.touches[0]
      this.startX = clientX
      this.startY = clientY
    }
    if (e.touches.length === 2) {

    }
  }
  touchmove = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      if (this.isSlide) {
        this.listInstance.slide(e)
        return
      }
      if (this.isZoom) {
        this.borderInstance.scale(e)
        return
      }
      const { clientX, clientY } = e.touches[0]
      const { thresholdX, thresholdY } = this.options
      const diffX = Math.abs(clientX - this.startX)
      const diffY = Math.abs(clientY - this.startY)
      if (diffX > thresholdX) {
        this.isSlide = true
        this.listInstance.slideStart(e)
      } else if (diffY > thresholdY) {
        this.isZoom = true
        this.borderInstance.scaleStart(e)
      }
    }
  }
  touchend = (e: TouchEvent) => {
    if (this.isSlide) {
      this.isSlide = false
      this.listInstance.slideEnd()
    } else if (this.isZoom) {
      this.isZoom = false
      const needZoomOut = this.borderInstance.scaleEnd()
      if (needZoomOut) {
        const to = this.options.targets[this.options.store.get('showIndex')].getClientRects()[0]
        this.listInstance.zoomOut(to)
        this.itemInstances.forEach(instance => instance.zoomOut(to))
      }
    }
  }

  destroy() {
    this.root.removeEventListener('touchstart', this.touchstart)
    this.root.removeEventListener('touchmove', this.touchmove)
    this.root.removeEventListener('touchend', this.touchend)
    document.body.removeChild(this.root)
  }
}