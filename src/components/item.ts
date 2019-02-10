import * as types from './type'
import { transition, transitionDuration } from './const';

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
  // #region 显示和隐藏时整体缩放
  initLeft: number
  initTop: number
  zoomIn(from: types.rect, to: types.rect) {
    const { width: x1, height: y1 } = from
    const { width: x2, height: y2 } = to
    let m
    let l3
    let t3
    this.changeStyle(this.dom, { width: x1 + 'px', height: y1 + 'px', transition: 'none' })
    const info = this.options.imgInfos[this.idx]
    const { width: x3, height: y3 } = info
    m = Math.max(x1 / x3, y1 / y3)
    l3 = (x1 - m * x3) / 2
    t3 = (y1 - m * y3) / 2
    this.changeStyle(this.img, { width: m * x3 + 'px', height: m * y3 + 'px', left: l3 + 'px', top: t3 + 'px', transition: 'none' })
    window.requestAnimationFrame(() => {
      if (x3 > x2 || y3 > y2) {
        m = Math.min(x2 / x3, y2 / y3)
      } else {
        m = 1
      }
      this.initLeft = l3 = (x2 - m * x3) / 2
      this.initTop = t3 = (y2 - m * y3) / 2
      this.changeStyle(this.dom, { width: x2 + 'px', height: y2 + 'px', transition })
      this.changeStyle(this.img, { width: m * x3 + 'px', height: m * y3 + 'px', left: l3 + 'px', top: t3 + 'px', transition })
    })
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
    this.changeStyle(this.img, { width: m * x3 + 'px', height: m * y3 + 'px', left: l3 + 'px', top: t3 + 'px', transform: 'scale(1)', transition })
    this.prevScale = 1
    this.initLeft = undefined
    this.initTop = undefined
  }
  // #endregion 显示和隐藏时整体缩放

  // #region 图片缩放
  base_distance: number
  transformOriginX: number
  transformOriginY: number
  scale: number
  prevScale = 1// 最后完成缩放时的缩放倍数
  getDiagonalDistance(t1: coordinate, t2: coordinate) {
    const { x: xt1, y: yt1 } = t1
    const { x: xt2, y: yt2 } = t2
    return Math.sqrt(Math.pow(xt1 - xt2, 2) + Math.pow(yt1 - yt2, 2))
  }
  imgZoomStart(e: TouchEvent) {
    const { touches } = e
    const { clientX: xt1, clientY: yt1 } = touches[0]
    const { clientX: xt2, clientY: yt2 } = touches[1]
    this.base_distance = this.getDiagonalDistance({ x: xt1, y: yt1 }, { x: xt2, y: yt2 })
    const l3 = this.img.offsetLeft
    const t3 = this.img.offsetTop
    const nextTransformOriginX = (xt1 + xt2) / 2 - l3
    const nextTransformOriginY = (yt1 + yt2) / 2 - t3
    // 解决第二次缩放由于缩放点不一样，会导致图像偏移
    if (this.transformOriginX && this.transformOriginY) {
      const offsetX = (this.transformOriginX - nextTransformOriginX) * (1 - this.scale)
      const offsetY = (this.transformOriginY - nextTransformOriginY) * (1 - this.scale)
      this.changeStyle(this.img, { left: `${l3 + offsetX}px`, top: `${t3 + offsetY}px` })
    }
    this.transformOriginX = nextTransformOriginX
    this.transformOriginY = nextTransformOriginY
    this.changeStyle(this.img, { transformOrigin: `${this.transformOriginX}px ${this.transformOriginY}px`, transition: 'none' })
  }
  imgZoom(e: TouchEvent) {
    const { touches } = e
    const { clientX: xt1, clientY: yt1 } = touches[0]
    const { clientX: xt2, clientY: yt2 } = touches[1]
    const new_distance = this.getDiagonalDistance({ x: xt1, y: yt1 }, { x: xt2, y: yt2 })

    let n = this.prevScale * (new_distance / this.base_distance)
    if (n < 1) n = 1
    this.scale = n
    this.changeStyle(this.img, { transform: `scale(${n})` })
  }
  imgZoomEnd() {
    const l3 = this.img.offsetLeft
    const t3 = this.img.offsetTop
    const { scale: n } = this
    this.prevScale = n
    const x0 = this.transformOriginX
    const y0 = this.transformOriginY
    const x4 = l3 + (1 - n) * x0
    const y4 = t3 + (1 - n) * y0
    // x轴
    const offsetX = this.checkOverflow({ edgeMin: 0, edgeMax: this.dom.clientWidth, length: this.img.clientWidth, scale: n, startPoint: x4 })
    // y轴
    const offsetY = this.checkOverflow({ edgeMin: 0, edgeMax: this.dom.clientHeight, length: this.img.clientHeight, scale: n, startPoint: y4 })
    this.setImgPosition(offsetX, offsetY)
    this.changeStyle(this.img, { transition })
    return n
  }

  setImgPosition(offsetX: number | string | undefined, offsetY: number | string | undefined) {
    const { transformOriginX: x0, transformOriginY: y0, scale: n } = this
    const edageXMax = this.dom.clientWidth
    const edageYMax = this.dom.clientHeight
    const width = this.img.clientWidth
    const height = this.img.clientHeight
    let left = this.img.offsetLeft
    let top = this.img.offsetTop
    // x轴
    if (typeof offsetX !== 'undefined') {
      if (typeof offsetX == 'string') {
        left = (edageXMax - n * width + 2 * x0 * (n - 1)) / 2
      } else {
        left = left + offsetX
      }
      this.changeStyle(this.img, { left: `${left}px` })
    }
    // y轴
    if (typeof offsetY !== 'undefined') {
      if (typeof offsetY == 'string') {
        top = (edageYMax - n * height + 2 * y0 * (n - 1)) / 2
      } else {
        top = top + offsetY
      }
      this.changeStyle(this.img, { top: `${top}px` })
    }
  }

  checkOverflow(params: checkOverflowParams) {
    const { edgeMax, edgeMin, length: len, scale: n, startPoint: sp } = params
    var ep = sp + n * len
    if (sp >= edgeMin && ep <= edgeMax) {
      return 'center'
    } else if (sp < edgeMin && ep > edgeMax) {
      /* do nothing */
      return 0
    } else if (sp < edgeMin && ep <= edgeMax) {// x轴为左侧溢出，y轴为顶部溢出
      const space = edgeMax - ep
      const abs_sp = Math.abs(sp)
      if (space >= abs_sp) {
        return 'center'
      } else {
        return space
      }
    } else if (sp >= edgeMin && ep > edgeMax) {// x轴为右侧溢出，y轴为底部溢出
      const space = ep - edgeMax
      if (space > sp) {
        return -sp
      } else {
        return 'center'
      }
    }
  }
  resetImg() {
    // 撤销缩放操作及缩放信息，防止再次缩放时由于origin的变化导致位置偏移
    this.transformOriginX = undefined
    this.transformOriginY = undefined
    this.scale = 1
    this.prevScale = 1

    setTimeout(() => {
      this.changeStyle(this.img, { left: this.initLeft + 'px', top: this.initTop + 'px', transition: 'none', transform: 'scale(1)' })
    }, transitionDuration)
  }
  // #endregion 图片缩放

  // #region 图片拖拽
  startX: number
  startY: number
  startLeft: number
  startTop: number
  dragStart(e: TouchEvent) {
    const { touches } = e
    const { clientX, clientY } = touches[0]
    this.startX = clientX
    this.startY = clientY
    this.startLeft = this.img.offsetLeft
    console.log('drag start ', this.startLeft)
    this.startTop = this.img.offsetTop
    this.changeStyle(this.img, { transition: 'none' })
  }
  dragMove(e: TouchEvent) {
    const { touches } = e
    const { clientX, clientY } = touches[0]
    const diffX = clientX - this.startX
    const diffY = clientY - this.startY
    const { scale: n, transformOriginX: x0, transformOriginY: y0 } = this
    const l3 = this.startLeft
    const t3 = this.startTop
    const x4 = l3 + (1 - n) * x0
    const y4 = t3 + (1 - n) * y0
    const offsetX = this.checkOverflow({ edgeMin: 0, edgeMax: document.body.clientWidth, length: this.img.clientWidth, scale: this.scale, startPoint: x4 + diffX })
    const offsetY = this.checkOverflow({ edgeMin: 0, edgeMax: document.body.clientHeight, length: this.img.clientHeight, scale: this.scale, startPoint: y4 + diffY })

    const listOffset = {
      offsetX: diffX, offsetY: diffY
    }
    let imgOffsetX = 0
    let imgOffsetY = 0

    if (typeof offsetX === 'number') {
      listOffset.offsetX = -offsetX
      imgOffsetX = diffX + offsetX
    }
    this.changeStyle(this.img, { left: `${l3 + imgOffsetX}px` })
    console.log('drag move ', l3 + imgOffsetX)
    if (typeof offsetY === 'number') {
      listOffset.offsetY = -offsetY
      imgOffsetY = diffY + offsetY
    }
    this.changeStyle(this.img, { top: `${t3 + imgOffsetY}px` })

    return listOffset
  }
  dragEnd(e: TouchEvent) {
    this.startX = undefined
    this.startY = undefined
    this.startLeft = undefined
    this.startTop = undefined
    this.changeStyle(this.img, { transition })
  }
}