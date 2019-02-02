// declare interface store {
//   store: object;
//   get: (key: string) => any;
//   set: (key: string, value: any) => any;
// }

export declare interface options {
  targets: HTMLElement[]
  thresholdX: number
  thresholdY: number
  urls: string[]
  clicked?: boolean
  store?: store
  // showIndex: number
}

export declare class _TouchEvent {
  thresholdX: number;
  thresholdY: number;
  moveDirection: string;
}

export declare interface rect {
  width: number;
  height: number;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  x?: number;
  y?: number;
}

export declare interface store {
  [key: string]: any
}
