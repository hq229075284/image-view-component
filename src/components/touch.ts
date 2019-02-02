import * as types from './type'
import { transitionDuration, transition, getNum, calcScale, onBodyTouchMove, getRange } from './const'


export class _TouchEvent {
  startX: number = 0 // 开始的点的x轴坐标
  startY: number = 0 // 开始的点的y轴坐标
  move: boolean = false // 当前是否在移动的过程中
  scale: number = 1 // 缩放比

  thresholdX: number // 超过此阈值时，认为是左右移动
  thresholdY: number // 超过此阈值时，认为是上下移动

  moveDirection: string // 移动方向

  constructor(options: types.options) {
    this.thresholdX = options.thresholdX || 30
    this.thresholdY = options.thresholdY || 30
  }

  touchstart = (e: TouchEvent) => {
    const { clientX, clientY } = e.touches[0]
    const scope = <HTMLElement>e.currentTarget
    this.startX = clientX
    this.startY = clientY
    this.move = false
    this.moveDirection = undefined // vertical or horizon
    this.scale = 1
    scope.style.transition = 'none'
    const list = <HTMLElement>scope.children[0]
    list.style.transition = 'none'
  }

  touchmove = (e: TouchEvent, options: types.options) => {
    const { clientX, clientY } = e.touches[0]
    let diffX = clientX - this.startX
    let diffY = clientY - this.startY
    if (!this.move) {
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
      }
      // 标识开始移动
      this.move = true
    }

    if (this.moveDirection === 'vertical') {
      const unit: number = 0.2 / 40
      const min_scale: number = 0.4
      const max_scale: number = 1
      this.scale = 1 - diffY * unit

      let backgroundRange = getRange([0, 1])
      let scaleRange = getRange([min_scale, max_scale])
      const _scale = backgroundRange(this.scale)
      this.scale = scaleRange(this.scale)

      const currentTarget = <HTMLBaseElement>e.currentTarget
      if (this.scale < 1) {
        currentTarget.style.top = `${diffY}px`
        currentTarget.style.bottom = `${-diffY}px`;
        (<HTMLElement>currentTarget.parentNode.children[0]).style.backgroundColor = `rgba(0,0,0,${_scale})`
      } else {
        // const _diffY = diffY < 0 ? 0 : diffY
        currentTarget.style.top = `${0}px`
        currentTarget.style.bottom = `${-0}px`;
        (<HTMLElement>currentTarget.parentNode.children[0]).style.backgroundColor = `rgba(0,0,0,1)`
      }
      currentTarget.style.transformOrigin = `${clientX}px ${clientY}px`
      currentTarget.style.transform = `scale(${this.scale})`
      currentTarget.style.left = `${diffX}px`
      currentTarget.style.right = `${-diffX}px`
    } else if (this.moveDirection === 'horizon') {
      const currentTarget = <HTMLElement>e.currentTarget
      const list = <HTMLElement>currentTarget.children[0]
      const showIndex = options.store.get('showIndex')
      const left = -showIndex * document.body.offsetWidth
      list.style.left = `${left + diffX}px`
      // list.style.transition = 'none'
    }
    // console.log('scale=>', this.scale)
    // console.log('scope.top=>', (<HTMLElement>e.currentTarget).style.top)
  }

  touchend = (e: TouchEvent, options: types.options) => {
    const scope = <HTMLElement>e.currentTarget
    scope.style.transition = transition
    const list = <HTMLElement>scope.children[0]

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
        scope.style.width = `${scope_width}px`
        scope.style.height = `${scope_height}px`
        scope.style.transform = `scale(${1 / scope_scale})`
        scope.style.transformOrigin = `0px 0px`
        scope.style.top = `${top}px`
        scope.style.bottom = `auto`
        scope.style.left = `${left}px`
        scope.style.right = `auto`

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

        (<HTMLElement>scope.parentNode.children[0]).style.backgroundColor = 'rgba(0,0,0,0)'
        store.set('animate', true)
        setTimeout(() => {
          // 隐藏元素
          (<HTMLElement>scope.parentNode).style.display = 'none'
          document.body.removeEventListener('touchmove', onBodyTouchMove)
          store.set('animate', false)
        }, transitionDuration)
      } else {
        scope.style.transition = transition
        scope.style.transform = ''
        scope.style.transformOrigin = '0px 0px'
        scope.style.top = '0px'
        scope.style.left = '0px';
        (<HTMLElement>scope.parentNode.children[0]).style.backgroundColor = 'rgba(0,0,0,1)'
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