import * as types from './type'
import { Border } from './border'
import { List } from './list'
import { Item } from './item'
import { Store } from './store'
import { createRoot } from './dom'
import { defaultOptions, transitionDuration } from './const'

export class Adapter {
  options: types.options
  root: HTMLElement
  borderInstance: Border
  listInstance: List
  itemInstances: Item[]
  constructor(options: types.options) {
    this.options = { ...defaultOptions, ...options, store: new Store() }
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
  preventDefault(e: TouchEvent) { e.preventDefault() }
  show(showIndex: number) {
    const { store } = this.options
    store.set('showIndex', showIndex)


    const _show = () => {
      // 禁止iOS的弹性滚动 微信的下拉回弹
      document.body.addEventListener('touchmove', this.preventDefault, { passive: false });

      const from = this.options.targets[showIndex].getClientRects()[0]
      const to = document.body.getClientRects()[0]
      this.borderInstance.zoomIn(from, to)
      this.borderInstance.bottom_description.textContent = `${this.listInstance.showIndex + 1}/${this.options.urls.length}`
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
      this.root.addEventListener('touchstart', this.touchstart)
      this.root.addEventListener('touchmove', this.touchmove)
      this.root.addEventListener('touchend', this.touchend)
      this.root.addEventListener('click', this.click)
      if (Array.isArray(this.options.imgInfos) && this.options.imgInfos.length === this.options.urls.length) {
        _show()
      } else {
        Promise.all(this.options.urls.map(this.getImgSize))
          .then((infos: types.rect[]) => this.options.imgInfos = infos)
          .then(_show)
          .catch(() => {
            throw new Error('图片加载失败')
          })
      }
    } else {
      _show()
    }
  }
  isImgZoom = false
  isZoom = false
  isSlide = false
  willClose = false
  isAction = () => this.isZoom || this.isSlide || this.isImgZoom || this.willClose
  // _startX: number
  // get startX() { return this._startX }
  // set startX(v) { console.log('v', v); this._startX = v }
  startX: number
  startY: number
  imgZoomScale = 1
  touchstart = (e: TouchEvent) => {
    // console.log('touch start')
    if (this.willClose) return
    if (e.touches.length === 1) {
      // console.log('single touch start')
      const { clientX, clientY } = e.touches[0]
      this.startX = clientX
      this.startY = clientY
      if (this.imgZoomScale > 1) {
        this.itemInstances[this.listInstance.showIndex].dragStart(e)
      }
    }
    if (e.touches.length === 2) {
      // console.log('multiple touch start')
      // 可能在单指事件后发生，撤销单指的操作
      this.startX = undefined
      this.startY = undefined

      const showIndex = this.options.store.get('showIndex')
      const itemInstance = this.itemInstances[showIndex]
      itemInstance.imgZoomStart(e)
      this.isImgZoom = true
    }
  }
  touchmove = (e: TouchEvent) => {
    if (this.willClose) return
    if (e.touches.length === 1) {
      // console.log('single touch move')
      const { clientX, clientY } = e.touches[0]
      if (this.isSlide) {
        this.listInstance.slide(e)
        return
      }
      if (this.isZoom) {
        this.borderInstance.scale(e)
        return
      }
      if (this.imgZoomScale > 1) {
        const { showIndex } = this.listInstance
        if (this.startX === undefined && this.startY === undefined) {
          // console.log('drag start')
          this.itemInstances[showIndex].dragStart(e)
        } else {
          // console.log('drag move')
          const offsetForList = this.itemInstances[showIndex].dragMove(e)
          // console.log('list left prev:' + this.listInstance.dom.offsetLeft)
          // console.log('x:', offsetForList.offsetX)
          const { clientX, clientY } = e.touches[0]
          const startPoint = { clientX: clientX - offsetForList.offsetX, clientY: clientY - offsetForList.offsetY } as Touch
          const touchEventStart = <TouchEvent><unknown>{ touches: [startPoint] }
          if (offsetForList.offsetX !== 0) {
            this.listInstance.slideStart(touchEventStart)
            this.listInstance.slide(e)
          }
          // console.log('list left next:', this.listInstance.dom.offsetLeft)
        }
        return
      }
      // const { clientX, clientY } = e.touches[0]
      const { thresholdX, thresholdY } = this.options
      // 仅当先触发双指放大图片后，仅一只手指离开屏幕，还有一只仍在屏幕上滑动的情况
      // 触发事件流程：touchstart=>touchmove=>touchend=>touchmove=>touchend
      if (this.startX === undefined || this.startY === undefined) {
        this.startX = clientX
        this.startY = clientY
        return
      }
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
    if (e.touches.length === 2) {
      const showIndex = this.options.store.get('showIndex')
      const itemInstance = this.itemInstances[showIndex]
      itemInstance.imgZoom(e)
    }
  }
  touchend = (e: TouchEvent, forceClose?: boolean) => {
    // console.log('touch end')
    if (this.willClose) return
    this.startX = undefined
    this.startY = undefined
    if (forceClose) {
      const to = this.options.targets[this.options.store.get('showIndex')].getClientRects()[0]
      this.borderInstance.zoomOut(to)
      this.listInstance.zoomOut(to)
      this.itemInstances.forEach(instance => instance.zoomOut(to))
      document.body.removeEventListener('touchmove', this.preventDefault, false);
      this.willClose = true
      setTimeout(() => this.willClose = false, transitionDuration)
    } else if (this.isSlide) {
      this.isSlide = false
      const prevShowIndex = this.listInstance.slideEnd()
      if (prevShowIndex !== undefined) {
        this.itemInstances[prevShowIndex].resetImg()
        this.borderInstance.bottom_description.textContent = `${this.listInstance.showIndex + 1}/${this.options.urls.length}`
      }
    } else if (this.isZoom) {
      this.isZoom = false
      const needZoomOut = this.borderInstance.scaleEnd()
      if (needZoomOut) {
        const to = this.options.targets[this.options.store.get('showIndex')].getClientRects()[0]
        this.listInstance.zoomOut(to)
        this.itemInstances.forEach(instance => instance.zoomOut(to))
        document.body.removeEventListener('touchmove', this.preventDefault, false);
        this.willClose = true
        setTimeout(() => this.willClose = false, transitionDuration)
      }
    } else if (this.isImgZoom) {
      this.isImgZoom = false
      const showIndex = this.options.store.get('showIndex')
      const itemInstance = this.itemInstances[showIndex]
      this.imgZoomScale = itemInstance.imgZoomEnd()
    } else if (this.imgZoomScale > 1) {
      const prevShowIndex = this.listInstance.slideEnd()
      if (prevShowIndex !== undefined) {
        this.itemInstances[prevShowIndex].resetImg()
        this.imgZoomScale = 1
        this.borderInstance.bottom_description.textContent = `${this.listInstance.showIndex + 1}/${this.options.urls.length}`
      }
    }
  }

  click = (e: any) => {
    this.touchend(e, true)
  }

  destroy() {
    this.root.removeEventListener('touchstart', this.touchstart)
    this.root.removeEventListener('touchmove', this.touchmove)
    this.root.removeEventListener('touchend', this.touchend)
    this.root.removeEventListener('touchcancel', this.touchend)
    this.root.removeEventListener('click', this.click)
    this.borderInstance = null
    this.listInstance = null
    this.itemInstances = null
    document.body.removeChild(this.root)
    document.body.removeEventListener('touchmove', this.preventDefault, false);
  }
}