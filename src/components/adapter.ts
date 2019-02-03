import * as types from './type'
import { createRoot } from './dom'
import { Store } from './store';
import OuterScope from './outerScope'
import InnerScope from './innerScope'
import { transitionDuration } from './const'

export default class Adapter {
  root: HTMLElement
  options: types.options
  outerInstance: OuterScope
  innerInstances: InnerScope[]
  constructor(options: types.options) {
    this.options = { ...options, store: new Store() }
  }
  show(showIndex: number) {
    this.options.store.set('showIndex', showIndex)
    if (!this.root) {
      this.root = createRoot(this.options)
      this.root.addEventListener('touchstart', this.touchStart)
      this.root.addEventListener('touchmove', this.touchMove)
      this.root.addEventListener('touchend', this.touchEnd)
      this.root.addEventListener('click', this.click)
    }
    let outerScope = this.root.children[1] as HTMLElement
    if (!this.outerInstance) {
      this.outerInstance = new OuterScope(outerScope, this.options)
    }
    let list = outerScope.children[0] as HTMLElement
    if (!this.innerInstances) {
      this.innerInstances = []
      for (let i = 0; i < list.children.length; i++) {
        const innerScope = list.children[i] as HTMLElement
        this.innerInstances.push(new InnerScope(innerScope, this.options, i))
      }
    }
    this.root.style.display = 'block'
    this.outerInstance.show()
  }
  isAction = () => this.move || this.zoom
  move = false
  moveDirection: string
  zoom = false
  startX = 0
  startY = 0
  touchStart = (e: TouchEvent) => {
    // const { outerInstance } = this
    const { touches } = e
    if (touches.length === 1) {
      const { clientX, clientY } = touches[0]
      this.startX = clientX
      this.startY = clientY
    } else if (touches.length === 2) {
    }

  }
  touchMove = (e: TouchEvent) => {
    const { outerInstance, options } = this
    const { touches } = e
    if (touches.length === 1 && (!this.isAction() || this.isAction() && this.move)) {
      const { clientX, clientY } = touches[0]
      let diffX = clientX - this.startX
      let diffY = clientY - this.startY
      if (!this.isAction() && !this.move) {
        // 还未到阈值,无法决定使用上下移动还是左右移动
        if (Math.abs(diffY) < options.thresholdY && Math.abs(diffX) < options.thresholdX) {
          return
        } else if (Math.abs(diffX) >= options.thresholdX) { // x轴先到达阈值，图片左右轮播
          this.moveDirection = 'horizon'
          // 重置x轴的起始点
          this.startX = clientX
          diffX = clientX - this.startX
        } else if (Math.abs(diffY) >= options.thresholdY) { // y轴先到达阈值，图片缩放移动
          this.moveDirection = 'vertical'
          // // 重置x轴的起始点        
          // this.startX = clientX
          // diffX = clientX - this.startX
          // // 重置y轴的起始点        
          // this.startY = clientY
          // diffY = clientY - this.startY
          outerInstance.startZoom(e)
        }
        // 标识开始移动
        this.move = true
      }
      if (this.moveDirection === 'vertical') {
        outerInstance.zoom(e)
      } else {

      }
    }

  }

  touchEnd = (e: TouchEvent) => {
    const { outerInstance } = this
    if (this.move || this.options.clicked) {
      const needZoomToTarget = outerInstance.endZoom(e)
      setTimeout(() => {
        this.move = false
        if (needZoomToTarget) {
          // this.root.style.display = 'none'
        }
      }, transitionDuration)
    }
  }

  click = (e: any) => {
    this.options.clicked = true
    this.touchEnd(<TouchEvent>e)
    this.options.clicked = false
  }
}