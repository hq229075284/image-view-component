import * as types from './type'
import { transition } from './const';

interface key_value {
  [key: string]: any
}

interface imgInfo {
  width: number,
  height: number
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
    this.dom.style.transition = transition
    this.img.style.transition = transition
  }
  changeStyle(target: HTMLElement, styles: key_value) {
    Object.keys(styles).map((styleKey: string) => (target.style as key_value)[styleKey] = styles[styleKey])
  }
  getImgSize() {
    return new Promise((resolve) => {
      const url = this.img.getAttribute('src')
      const m = new Image()
      m.src = url
      m.onload = function (e) {
        resolve({ width: m.width, height: m.height })
      }
    })
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
      this.changeStyle(this.dom, { width: x2 + 'px', height: y2 + 'px' })
      this.changeStyle(this.img, { width: m * x3 + 'px', height: m * y3 + 'px', left: l3 + 'px', top: t3 + 'px' })
    })
  }

  zoomOut(to: types.rect) {
    // const { width: x2, height: y2 } = from
    const { width: x1, height: y1 } = to
    let m
    let l3
    let t3
    this.getImgSize().then((info: imgInfo) => {
      const { width: x3, height: y3 } = info
      m = Math.max(x1 / x3, y1 / y3)
      l3 = (x1 - m * x3) / 2
      t3 = (y1 - m * y3) / 2
      this.changeStyle(this.dom, { width: x1 + 'px', height: y1 + 'px' })
      this.changeStyle(this.img, { width: m * x3 + 'px', height: m * y3 + 'px', left: l3 + 'px', top: t3 + 'px' })
    })
  }
}