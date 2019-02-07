import * as types from './type'
import { transition } from './const';

interface key_value {
  [key: string]: any
}

interface coordinate {
  x: number
  y: number
}

interface checkOverflowParams {
  edgeMax: number
  edgeMin: number
  startPoint: number
  length: number,
  scale: number
}

export class Item {
  dom: HTMLElement
  img: HTMLElement
  options: types.options
  idx: number
  constructor(dom: HTMLElement, options: types.options, idx: number) {
    this.dom = dom
    this.img = dom.querySelector('img')
    this.options = options
    this.idx = idx
    // this.dom.style.transition = transition
    // this.img.style.transition = transition
  }
  changeStyle(target: HTMLElement, styles: key_value) {
    Object.keys(styles).map((styleKey: string) => (target.style as key_value)[styleKey] = styles[styleKey])
  }
  zoomIn(from: types.rect, to: types.rect) {
    const { width: x1, height: y1 } = from
    const { width: x2, height: y2 } = to
    let m
    let l3
    let t3
    this.changeStyle(this.dom, { width: x1 + 'px', height: y1 + 'px' })
    const info = this.options.imgInfos[this.idx]
    const { width: x3, height: y3 } = info
    m = Math.max(x1 / x3, y1 / y3)
    l3 = (x1 - m * x3) / 2
    t3 = (y1 - m * y3) / 2
    this.changeStyle(this.img, { width: m * x3 + 'px', height: m * y3 + 'px', left: l3 + 'px', top: t3 + 'px' })
    window.requestAnimationFrame(() => {
      if (x3 > x2 || y3 > y2) {
        m = Math.min(x2 / x3, y2 / y3)
      } else {
        m = 1
      }
      l3 = (x2 - m * x3) / 2
      t3 = (y2 - m * y3) / 2
      this.changeStyle(this.dom, { width: x2 + 'px', height: y2 + 'px', transition })
      this.changeStyle(this.img, { width: m * x3 + 'px', height: m * y3 + 'px', left: l3 + 'px', top: t3 + 'px', transition })
    })
  }

  getDiagonalDistance(t1: coordinate, t2: coordinate) {
    const { x: xt1, y: yt1 } = t1
    const { x: xt2, y: yt2 } = t1
    return Math.sqrt(Math.pow(xt1 - xt2, 2) + Math.pow(yt1 - yt2, 2))
  }

  zoomOut(to: types.rect) {
    // const { width: x2, height: y2 } = from
    const { width: x1, height: y1 } = to
    let m
    let l3
    let t3
    const info = this.options.imgInfos[this.idx]
    const { width: x3, height: y3 } = info
    m = Math.max(x1 / x3, y1 / y3)
    l3 = (x1 - m * x3) / 2
    t3 = (y1 - m * y3) / 2
    this.changeStyle(this.dom, { width: x1 + 'px', height: y1 + 'px' })
    this.changeStyle(this.img, { width: m * x3 + 'px', height: m * y3 + 'px', left: l3 + 'px', top: t3 + 'px' })
  }
  base_distance: number
  transformOriginX: number
  transformOriginY: number
  scale: number
  imgZoomStart(e: TouchEvent) {
    const { touches } = e
    const { clientX: xt1, clientY: yt1 } = touches[0]
    const { clientX: xt2, clientY: yt2 } = touches[1]
    this.base_distance = this.getDiagonalDistance({ x: xt1, y: yt1 }, { x: xt2, y: yt2 })
    const l3 = this.img.offsetLeft
    const t3 = this.img.offsetTop
    this.transformOriginX = (xt1 + xt2) / 2 - l3
    this.transformOriginY = (yt1 + yt2) / 2 - t3
    this.changeStyle(this.img, { transformOrigin: `${this.transformOriginX}px ${this.transformOriginY}px`, transition: 'none' })
  }
  imgZoom(e: TouchEvent) {
    const { touches } = e
    const { clientX: xt1, clientY: yt1 } = touches[0]
    const { clientX: xt2, clientY: yt2 } = touches[1]
    const new_distance = this.getDiagonalDistance({ x: xt1, y: yt1 }, { x: xt2, y: yt2 })
    let n = new_distance / this.base_distance
    if (n < 1) n = 1
    this.scale = n
    this.changeStyle(this.img, { transform: `scale(${n})` })
  }
  imgZoomEnd() {
    const l3 = this.img.offsetLeft
    const t3 = this.img.offsetTop
    const { scale: n } = this
    const x0 = this.transformOriginX
    const y0 = this.transformOriginY
    const x4 = x0 + n * (l3 - x0)
    const y4 = y0 + n * (t3 - y0)
    // x轴
    const offsetX = this.checkOverflow({ edgeMin: 0, edgeMax: this.dom.clientWidth, length: this.img.clientWidth, scale: n, startPoint: x4 })
    // y轴
    const offsetY = this.checkOverflow({ edgeMin: 0, edgeMax: this.dom.clientHeight, length: this.img.clientHeight, scale: n, startPoint: y4 })
    this.setImgPosition(offsetX, offsetY)
    this.changeStyle(this.img, { transition })
  }

  setImgPosition(offsetX: number | string, offsetY: number | string) {
    const { transformOriginX: x0, transformOriginY: y0, scale: n } = this
    const edageXMax = this.dom.clientWidth
    const edageYMax = this.dom.clientHeight
    const width = this.img.clientWidth
    const height = this.img.clientHeight
    let left, top
    // x轴
    if (typeof offsetX == 'string') {
      left = (edageXMax - n * width + 2 * x0 * (n - 1)) / (2 * n)
    } else {
      left = this.img.offsetLeft + offsetX
    }
    this.changeStyle(this.img, { left: `${left}px` })
    // y轴
    if (typeof offsetY == 'string') {
      top = (edageYMax - n * height + 2 * y0 * (n - 1)) / (2 * n)
    } else {
      top = this.img.offsetTop + offsetY
    }
    this.changeStyle(this.img, { top: `${top}px` })
  }

  checkOverflow(params: checkOverflowParams) {
    const { edgeMax, edgeMin, length: len, scale: n, startPoint: sp } = params
    var ep = sp + n * len
    if (sp >= edgeMin && ep <= edgeMax) {
      // moveToCenter()
      return 'center'
    } else if (sp < edgeMin && ep > edgeMax) {
      /* do nothing */
    } else if (sp < edgeMin && ep <= edgeMax) {// x轴为左侧溢出，y轴为顶部溢出
      const diffY = edgeMax - ep
      const abs_sp = Math.abs(sp)
      if (diffY >= abs_sp) {
        return 'center'
      } else {
        return -diffY
      }
    } else if (sp >= edgeMin && ep > edgeMax) {// x轴为右侧溢出，y轴为底部溢出
      const diffY = ep - edgeMax
      if (diffY > sp) {
        return sp
      } else {
        return 'center'
      }
    }
  }
}