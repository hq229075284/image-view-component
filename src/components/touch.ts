import * as types from './type'
import { transitionDuration, transition, getNum, calcScale, onBodyTouchMove, getRange, getMultipleXY, calcDiagonalDistance } from './const'


export class _TouchEvent {
  startX: number = 0 // 开始的点的x轴坐标
  startY: number = 0 // 开始的点的y轴坐标
  transformOriginX: number = 0
  transformOriginY: number = 0
  defaultDistance: number = 0
  // move: boolean = false // 当前是否在移动的过程中
  scale: number = 1 // 缩放比

  isAction = false

  _move: boolean = false
  get move() {
    return this._move
  }
  set move(value) {
    this.isAction = value
    this._move = value
  }

  _isItemScale: boolean = false
  get isItemScale() {
    return this._isItemScale
  }
  set isItemScale(value) {
    this.isAction = value
    this._isItemScale = value
  }

  thresholdX: number // 超过此阈值时，认为是左右移动
  thresholdY: number // 超过此阈值时，认为是上下移动

  moveDirection: string // 移动方向

  constructor(options: types.options) {
    this.thresholdX = options.thresholdX
    this.thresholdY = options.thresholdY
  }

  touchstart = (e: TouchEvent) => {
    const { touches } = e
    if (touches.length === 2) {
      this.isItemScale = true
      const { x1, x2, y1, y2 } = getMultipleXY(touches)
      this.transformOriginX = (x1 + x2) / 2
      this.transformOriginY = (y1 + y2) / 2
      this.defaultDistance = calcDiagonalDistance({ x1, x2, y1, y2 })
    } else if (touches.length === 1) {
      const { clientX, clientY } = e.touches[0]
      const outerScope = <HTMLElement>e.currentTarget
      this.startX = clientX
      this.startY = clientY
      this.move = false
      this.moveDirection = undefined // vertical or horizon
      this.scale = 1
      outerScope.style.transition = 'none'
      const list = <HTMLElement>outerScope.children[0]
      list.style.transition = 'none'
    }
  }

  touchmove = (e: TouchEvent, options: types.options) => {
    const { clientX, clientY } = e.touches[0]
    const outerScope = <HTMLElement>e.currentTarget
    let diffX = clientX - this.startX
    let diffY = clientY - this.startY
    if (!this.isAction && !this.move) {
      // 还未到阈值,无法决定使用上下移动还是左右移动
      if (Math.abs(diffY) < this.thresholdY && Math.abs(diffX) < this.thresholdX) {
        return
      } else if (Math.abs(diffX) >= this.thresholdX) { // x轴先到达阈值，图片左右轮播
        this.moveDirection = 'horizon'
        // 重置x轴的起始点
        this.startX = clientX
        diffX = clientX - this.startX
      } else if (Math.abs(diffY) >= this.thresholdY) { // y轴先到达阈值，图片缩放移动
        this.moveDirection = 'vertical'
        // 重置x轴的起始点        
        this.startX = clientX
        diffX = clientX - this.startX
        // 重置y轴的起始点        
        this.startY = clientY
        diffY = clientY - this.startY

        outerScope.style.transformOrigin = `${clientX}px ${clientY}px`
      }
      // 标识开始移动
      this.move = true
    }

    if (this.move) {
      if (this.moveDirection === 'vertical') {
        const unit: number = 0.2 / 40
        const min_scale: number = 0.4
        const max_scale: number = 1
        this.scale = 1 - diffY * unit

        let backgroundRange = getRange([0, 1])
        let scaleRange = getRange([min_scale, max_scale])
        const bg_alpha = backgroundRange(this.scale)
        this.scale = scaleRange(this.scale)

        if (this.scale < 1) {
          outerScope.style.top = `${diffY}px`
          outerScope.style.bottom = `${-diffY}px`;
          (<HTMLElement>outerScope.parentNode.children[0]).style.backgroundColor = `rgba(0,0,0,${bg_alpha})`
        } else {
          outerScope.style.top = `${0}px`
          outerScope.style.bottom = `${-0}px`;
          (<HTMLElement>outerScope.parentNode.children[0]).style.backgroundColor = `rgba(0,0,0,1)`
        }
        outerScope.style.transform = `scale(${this.scale})`
        outerScope.style.left = `${diffX}px`
        outerScope.style.right = `${-diffX}px`
      } else if (this.moveDirection === 'horizon') {
        const list = <HTMLElement>outerScope.children[0]
        const showIndex = options.store.get('showIndex')
        const left = -showIndex * document.body.offsetWidth
        list.style.left = `${left + diffX}px`
      }
    } else if (this.isItemScale) {
      /* some code */
      // const { touches } = e
      // const { x1, x2, y1, y2 } = getMultipleXY(touches)
      // const newDistance = calcDiagonalDistance({ x1, x2, y1, y2 })
      // const itemScale = newDistance / this.defaultDistance
    }
  }

  touchend = (e: TouchEvent, options: types.options) => {
    const outerScope = <HTMLElement>e.currentTarget
    outerScope.style.transition = transition
    const list = <HTMLElement>outerScope.children[0]

    const needExec = options.clicked || (this.move)
    if (!needExec) return
    const { targets, store } = options
    if (options.clicked || this.moveDirection === 'vertical') {
      if (this.scale < 0.5 || options.clicked) {
        const target = targets[options.store.get('showIndex')]
        const { top, left, width: t_width, height: t_height } = target.getClientRects()[0]
        const scope_scale = calcScale(target.getClientRects()[0], document.body.getClientRects()[0]).min
        const scope_width = t_width * scope_scale
        const scope_height = t_height * scope_scale
        outerScope.style.width = `${scope_width}px`
        outerScope.style.height = `${scope_height}px`
        outerScope.style.transform = `scale(${1 / scope_scale})`
        outerScope.style.transformOrigin = `0px 0px`
        outerScope.style.top = `${top}px`
        outerScope.style.bottom = `auto`
        outerScope.style.left = `${left}px`
        outerScope.style.right = `auto`

        // 缩放图片抽屉的宽度
        const showIndex = store.get('showIndex')
        list.style.left = `-${showIndex * scope_width}px`
        list.style.width = `${list.children.length * scope_width}px`
        list.style.transition = transition

        // 缩放图片的宽度
        const items = list.children
        for (let i = 0; i < items.length; i++) {
          const item = <HTMLElement>items[i]
          item.style.width = `${scope_width}px`
          item.style.backgroundSize = 'cover'
          item.style.transition = transition
        }

        (<HTMLElement>outerScope.parentNode.children[0]).style.backgroundColor = 'rgba(0,0,0,0)'
        store.set('animate', true)
        setTimeout(() => {
          // 隐藏元素
          (<HTMLElement>outerScope.parentNode).style.display = 'none'
          document.body.removeEventListener('touchmove', onBodyTouchMove)
          store.set('animate', false)
        }, transitionDuration)
      } else {
        outerScope.style.transition = transition
        outerScope.style.transform = ''
        outerScope.style.transformOrigin = '0px 0px'
        outerScope.style.top = '0px'
        outerScope.style.left = '0px';
        (<HTMLElement>outerScope.parentNode.children[0]).style.backgroundColor = 'rgba(0,0,0,1)'
        store.set('animate', true)
        setTimeout(() => {
          store.set('animate', false)
        }, transitionDuration)
      }
    } else if (this.moveDirection === 'horizon') {
      const left = getNum(window.getComputedStyle(list).left)
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
      list.style.left = `-${showIndex * body_width}px`
      list.style.transition = transition
      store.set('animate', true)
      setTimeout(() => store.set('animate', false), transitionDuration)
    }
  }
}