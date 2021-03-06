import * as types from './type'
import { transition, transitionDuration } from './const';

interface key_value {
  [key: string]: any
}

export class Border {
  dom: HTMLElement
  shadow: HTMLElement
  root: HTMLElement
  top_description: HTMLElement
  bottom_description: HTMLElement
  options: types.options
  constructor(dom: HTMLElement, options: types.options) {
    this.root = dom.parentNode as HTMLElement
    this.shadow = this.root.querySelector('.shadow')
    this.top_description = this.root.querySelector('.top-description')
    this.bottom_description = this.root.querySelector('.bottom-description')
    this.top_description.style.transition = transition
    this.bottom_description.style.transition = transition
    this.dom = dom
    this.options = options
    this.shadow.style.transition = transition
    // this.dom.style.transition = transition
  }
  changeStyle(target: HTMLElement, styles: key_value) {
    Object.keys(styles).map((styleKey: string) => (target.style as key_value)[styleKey] = styles[styleKey])
  }
  zoomIn(from: types.rect, to: types.rect) {
    const { width: x1, height: y1, left: l1, top: t1 } = from
    const { width: x2, height: y2, left: l2, top: t2 } = to
    this.changeStyle(this.root, { visibility: 'visible', width: '100%' })
    this.changeStyle(this.shadow, { backgroundColor: `rgba(0,0,0,0)` })
    this.changeStyle(this.dom, { width: x1 + 'px', height: y1 + 'px', left: l1 + 'px', top: t1 + "px", transition: 'none' })
    this.changeStyle(this.top_description, { top: -this.top_description.clientHeight + 'px' })
    this.changeStyle(this.bottom_description, { bottom: -this.bottom_description.clientHeight + 'px' })
    window.requestAnimationFrame(() => {
      this.changeStyle(this.shadow, { backgroundColor: `rgba(0,0,0,1)` })
      this.changeStyle(this.dom, { width: x2 + 'px', height: y2 + 'px', left: l2 + 'px', top: t2 + "px", transition })
      this.changeStyle(this.top_description, { top: 0 })
      this.changeStyle(this.bottom_description, { bottom: 0 })
    })
  }
  zoomOut(to: types.rect) {
    // const { width: x2, height: y2, left: l2, top: t2 } = from
    const { width: x1, height: y1, left: l1, top: t1 } = to
    // this.changeStyle({ width: x2 + 'px', height: y2 + 'px', left: l2 + 'px', top: t2 + "px" })
    this.changeStyle(this.dom, { width: x1 + 'px', height: y1 + 'px', left: l1 + 'px', top: t1 + "px" })
    this.changeStyle(this.shadow, { backgroundColor: `rgba(0,0,0,${0})` })
    this.changeStyle(this.top_description, { top: -this.top_description.clientHeight + 'px' })
    this.changeStyle(this.bottom_description, { bottom: -this.bottom_description.clientHeight + 'px' })
    // const now = Date.now()
    // console.log('zoomout', now)
    setTimeout(() => {
      // console.log('display:none for ', now)
      this.changeStyle(this.root, { visibility: 'hidden', width: 0 })
    }, transitionDuration)
  }
  startX: number
  startY: number
  zoom: number
  scaleStart(e: TouchEvent) {
    const { touches } = e
    const { clientX, clientY } = touches[0]
    this.startX = clientX
    this.startY = clientY
    this.changeStyle(this.dom, { transition: 'none', tranformOrigin: `${clientX}px ${clientY}px` })
    this.changeStyle(this.shadow, { transition: 'none' })
  }
  scale(e: TouchEvent) {
    const { touches } = e
    const { clientX, clientY } = touches[0]
    const diffX = clientX - this.startX
    const diffY = clientY - this.startY
    const scale = 0.1 / 40
    let s = 1 - diffY * scale
    if (s > 1) s = 1
    if (s < 0) s = 0
    this.changeStyle(this.shadow, { backgroundColor: `rgba(0,0,0,${s}` })
    if (s > 1) s = 1
    if (s < 0.4) s = 0.4
    this.changeStyle(this.dom, { left: diffX + 'px', top: diffY + 'px', transform: `scale(${s})` })
    this.zoom = s
  }
  scaleEnd() {
    this.changeStyle(this.dom, { transition })
    this.changeStyle(this.shadow, { transition })
    if (this.zoom < this.options.zoomOutThreshold) {
      this.changeStyle(this.dom, { transform: `scale(${1})` })
      const showIndex = this.options.store.get('showIndex')
      this.zoomOut(this.options.targets[showIndex].getClientRects()[0])
      return true
    } else {
      this.changeStyle(this.dom, { left: 0 + 'px', top: 0 + 'px', transform: `scale(${1})` })
      this.changeStyle(this.shadow, { backgroundColor: `rgba(0,0,0,${1})` })
      return false
    }
  }
}