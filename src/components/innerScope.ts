import * as types from './type'
export default class InnerScope {
  dom: HTMLElement
  item: HTMLElement
  options: types.options
  idx: number
  constructor(dom: HTMLElement, options: types.options, idx: number) {
    this.dom = dom
    this.dom.style.width = `${document.body.clientWidth}px`
    this.options = options
    this.idx = idx
    this.item = dom.children[0] as HTMLElement
    this.item.style.backgroundImage = `url(${options.urls[idx]})`
  }

}