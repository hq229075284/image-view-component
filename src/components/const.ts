import * as types from './type'

export const transitionDuration: number = 300

export const transition: string = `all ${transitionDuration}ms ease-out`

export function getNum(str: string) { return parseFloat(str.replace('px', '')) }

export function calcScale(origin: types.rect, target: types.rect) {
  const width_scale = target.width / origin.width
  const height_scale = target.height / origin.height
  return {
    min: Math.min(width_scale, height_scale),// contain
    max: Math.max(width_scale, height_scale),// cover
  }
}

export function onBodyTouchMove(e: TouchEvent) {
  e.preventDefault()
}

export function getRange(range: number[]) {
  const [min, max] = range
  return function getValue(n: number): number {
    if (n > max) return max
    if (n < min) return min
    return n
  }
}