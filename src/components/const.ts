import * as types from './type'

export const transitionDuration: number = 300

export const transition: string = `all ${transitionDuration}ms linear`

export function getNum(str: string) { return parseFloat(str.replace('px', '')) }

export function calcScale(origin: types.rect, target: types.rect) {
  const width_scale = target.width / origin.width
  const height_scale = target.height / origin.height
  return {
    min: Math.min(width_scale, height_scale),// contain
    contain: Math.min(width_scale, height_scale),// contain
    max: Math.max(width_scale, height_scale),// cover
    cover: Math.max(width_scale, height_scale),// cover
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

export function getMultipleXY(touches: TouchList) {
  interface map {
    [key: string]: number
  }
  const map: map = {}
  for (let i = 1; i <= touches.length; i++) {
    const { clientX, clientY } = touches[i]
    map[`x${i}`] = clientX
    map[`y${i}`] = clientY
  }
  return map
}

export function calcDiagonalDistance(position: { x1: number, x2: number, y1: number, y2: number }) {
  const { x1, x2, y1, y2 } = position
  return Math.sqrt(Math.abs(x1 - x2) ** 2 + Math.abs(y1 - y2) ** 2)
}

export const defaultOptions: types.options = {
  targets: [],
  thresholdX: 30,
  thresholdY: 30,
  urls: [],
  imgInfos: [],
  zoomOutThreshold: 0.6
}