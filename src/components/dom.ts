import * as types from './type'
import { transition, calcScale } from './const'

export function createRoot(options: types.options): HTMLElement {
  let dom: HTMLElement
  const div = document.createElement('div')
  div.classList.add('drag-scale')
  const shadow = document.createElement('div')
  shadow.classList.add('shadow')
  div.append(shadow)
  const scope = document.createElement('div')
  scope.classList.add('scope')
  const list = document.createElement('div')
  list.classList.add('list')
  options.targets.forEach(() => {
    const item = document.createElement('div')
    item.classList.add('item')
    list.append(item)
  })
  scope.append(list)
  div.append(scope)
  document.body.append(div)
  dom = div
  return dom
}

export function resetScopeStyle(scope: HTMLElement, options: types.options) {
  const { targets, store } = options
  const target = targets[store.get('showIndex')]
  const { top, left, width: t_width, height: t_height } = target.getClientRects()[0]
  const { width, height } = document.body.getClientRects()[0]
  const scale = calcScale({ width: t_width, height: t_height }, { width, height }).min
  scope.style.top = `${top}px`
  scope.style.left = `${left}px`
  scope.style.width = `${t_width * scale}px`
  scope.style.height = `${t_height * scale}px`
  scope.style.transform = `scale(${1 / scale})`;
  (scope.parentNode as HTMLElement).style.display = 'block';
  (scope.parentNode.children[0] as HTMLElement).style.backgroundColor = 'rgba(0,0,0,0)'
  scope.style.transformOrigin = '0px 0px'
  store.set('scope width', t_width * scale)

  return [function cb() {
    scope.style.transition = transition
    scope.style.height = `${height}px`
    scope.style.width = `${width}px`
    scope.style.transform = ''
    scope.style.transformOrigin = '0px 0px'
    scope.style.top = '0px'
    scope.style.left = '0px';
    (<HTMLElement>scope.parentNode.children[0]).style.backgroundColor = 'rgba(0,0,0,1)'
  }]
}

export function resetItemStyle(items: HTMLCollection, options: types.options) {
  const { store, urls } = options
  let { width } = document.body.getClientRects()[0]
  const cbs = []
  for (let i = 0; i < items.length; i++) {
    const item = <HTMLElement>items[i]
    item.style.width = `${store.get('scope width')}px`
    // item.style.height = `${height}px`
    item.style.backgroundSize = 'contain'
    item.style.backgroundImage = `url(${urls[i]})`
    item.style.transition = 'none'
    cbs.push(() => {
      item.style.transition = transition
      item.style.width = `${width}px`
    })
  }
  return cbs
}

export function resetListStyle(list: HTMLElement, options: types.options) {
  const { store } = options
  const showIndex = store.get('showIndex')
  const scope_width = store.get('scope width')
  let { width } = document.body.getClientRects()[0]
  list.style.transition = 'none'
  list.style.left = `-${scope_width * showIndex}px`
  list.style.width = `${list.children.length * scope_width}px`
  return [() => {
    list.style.transition = transition
    list.style.left = `-${width * showIndex}px`
    list.style.width = `${list.children.length * width}px`
  }]
}