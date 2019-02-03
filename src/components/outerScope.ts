import * as types from './type'
import { calcScale, getRange, transition } from './const'
export default class OuterScope {
  startX: number
  startY: number
  scale: number
  dom: HTMLElement
  options: types.options
  constructor(dom: HTMLElement, options: types.options) {
    this.dom = dom
    this.options = options
  }

  show() {
    const { scale, transformOriginX, transformOriginY } = this.getScaleInfo()
    const transform = `scale(${scale})`
    this.dom.style.transformOrigin = `${transformOriginX}px ${transformOriginY}px`
    this.dom.style.transition = ''
    this.dom.style.transform = transform;
    (<HTMLElement>this.dom.parentNode.children[0]).style.backgroundColor = `rgba(0,0,0,1)`


    window.requestAnimationFrame(() => {
      this.dom.style.transform = 'scale(1)'
      this.dom.style.transition = transition
    })
  }

  getScaleInfo() {
    const showIndex = this.options.store.get('showIndex')
    const target: HTMLElement = this.options.targets[showIndex]
    const { width, height, left, top } = target.getClientRects()[0]
    const { clientWidth, clientHeight } = document.body
    const n = calcScale({ width: clientWidth, height: clientHeight }, { width, height }).cover
    const transformOriginX = left * (1 - n)
    const transformOriginY = top * (1 - n)
    return {
      scale: n,
      transformOriginX,
      transformOriginY,
    }
  }

  startZoom(e: TouchEvent) {
    const { clientX, clientY } = e.touches[0]
    this.startX = clientX
    this.startY = clientY
    this.dom.style.transformOrigin = `${clientX}px ${clientY}px`
    this.dom.style.transition = ""
  }

  zoom(e: TouchEvent) {
    const { clientX, clientY } = e.touches[0]
    const diffX = clientX - this.startX
    const diffY = clientY - this.startY
    this.dom.style.left = `${diffX}px`
    this.dom.style.top = `${diffY}px`
    const unit: number = 0.2 / 40
    const min_scale: number = 0.4
    const max_scale: number = 1
    const scale = 1 - diffY * unit

    let backgroundRange = getRange([0, 1])
    let scaleRange = getRange([min_scale, max_scale])
    const bg_alpha = backgroundRange(scale)
    this.scale = scaleRange(scale)

    if (this.scale < 1) {
      this.dom.style.top = `${diffY}px`;
      (<HTMLElement>this.dom.parentNode.children[0]).style.backgroundColor = `rgba(0,0,0,${bg_alpha})`
    } else {
      this.dom.style.top = `${0}px`;
      (<HTMLElement>this.dom.parentNode.children[0]).style.backgroundColor = `rgba(0,0,0,1)`
    }
    this.dom.style.transform = `scale(${this.scale})`
  }

  endZoom(e: TouchEvent) {
    if (this.scale < 0.5 || this.options.clicked) {
      this.scaleToTarget()
      return true
    } else {
      this.resetOuterScope()
      return false
    }

  }

  scaleToTarget() {
    const { scale, transformOriginX, transformOriginY } = this.getScaleInfo()
    this.dom.style.left = `${0}px`
    this.dom.style.top = `${0}px`
    this.dom.style.transform = `scale(${scale})`
    this.dom.style.transformOrigin = `${transformOriginX}px ${transformOriginY}px`
    this.dom.style.transition = transition
  }

  resetOuterScope() {
    this.dom.style.left = `${0}px`
    this.dom.style.top = `${0}px`
    this.dom.style.transform = `scale(1)`
    this.dom.style.transition = transition
  }
}