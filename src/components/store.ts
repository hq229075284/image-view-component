import { store } from './type'

export class Store {
  store: store = {}
  get(propName: string): any {
    return this.store[propName]
  }
  set(propName: string, value: any): any {
    return this.store[propName] = value
  }
}