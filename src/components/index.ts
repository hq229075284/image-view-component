import * as types from './type'
import { createRoot, resetScopeStyle, resetItemStyle, resetListStyle } from './dom'
import { _TouchEvent } from './touch'
import { transitionDuration, onBodyTouchMove } from './const'
import { Store } from './store'


export default function DragSacle(Options: types.options) {
  const defaultOptions: types.options = {
    targets: [],
    urls: [],
    thresholdX: 30,
    thresholdY: 30,
  }
  const options = { ...defaultOptions, ...Options }

  const root = createRoot(options)

  const outerScope = <HTMLElement>root.children[1]

  const list = <HTMLElement>outerScope.children[0]

  const touchEvent = new _TouchEvent(options)

  const store = new Store()
  options.store = store

  const touchmove = (e: TouchEvent) => touchEvent.touchmove(e, options)
  const touchend = (e: TouchEvent) => touchEvent.touchend(e, options)

  const click = (e: TouchEvent) => !store.get('animate') && touchEvent.touchend(e, { ...options, clicked: true })

  outerScope.addEventListener('click', click)
  outerScope.addEventListener('touchstart', touchEvent.touchstart)
  outerScope.addEventListener('touchmove', touchmove)
  outerScope.addEventListener('touchend', touchend)

  return {
    delete() {
      this.removeEventListener()
      document.body.removeChild(root)
    },
    removeListener: () => {
      outerScope.removeEventListener('touchstart', touchEvent.touchstart)
      outerScope.removeEventListener('touchmove', touchmove)
      outerScope.removeEventListener('touchend', touchend)
      outerScope.removeEventListener('click', click)
    },
    show: (showIndex: number | string) => {
      store.set('showIndex', showIndex)
      document.body.addEventListener('touchmove', onBodyTouchMove, { passive: false })
      const cb1 = resetScopeStyle(outerScope, options)
      const cb2 = resetListStyle(list, options)
      const cb3 = resetItemStyle(list.children, options)
      store.set('animate', true)
      setTimeout(() => {
        cb1.forEach(fn => fn())
        cb2.forEach(fn => fn())
        cb3.forEach(fn => fn())
        setTimeout(() => {
          store.set('animate', false)
        }, transitionDuration);
      }, 16.7)
    }
  }
}

