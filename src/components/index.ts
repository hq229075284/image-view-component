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

  const scope = <HTMLElement>root.children[1]

  const touchEvent = new _TouchEvent(options)

  const store = new Store()
  options.store = store

  const touchmove = (e: TouchEvent) => touchEvent.touchmove(e, options)
  const touchend = (e: TouchEvent) => touchEvent.touchend(e, options)

  const click = (e: TouchEvent) => !store.get('animate') && touchEvent.touchend(e, { ...options, clicked: true })

  scope.addEventListener('click', click)
  scope.addEventListener('touchstart', touchEvent.touchstart)
  scope.addEventListener('touchmove', touchmove)
  scope.addEventListener('touchend', touchend)

  return {
    delete() {
      this.removeEventListener()
      document.body.removeChild(root)
    },
    removeListener: () => {
      scope.removeEventListener('touchstart', touchEvent.touchstart)
      scope.removeEventListener('touchmove', touchmove)
      scope.removeEventListener('touchend', touchend)
      scope.removeEventListener('click', click)
    },
    show: (showIndex: number | string) => {
      store.set('showIndex', showIndex)
      document.body.addEventListener('touchmove', onBodyTouchMove, { passive: false })
      const cb1 = resetScopeStyle(scope, options)
      const cb2 = resetListStyle(scope.children[0] as HTMLElement, options)
      const cb3 = resetItemStyle(scope.children[0].children, options)
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

