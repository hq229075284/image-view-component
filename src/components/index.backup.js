function createShadow() {
  let dom
  return function create(options) {
    if (!dom) {
      const div = document.createElement('div')
      div.classList.add('drag-scale')
      const shadow = document.createElement('div')
      shadow.classList.add('shadow')
      div.append(shadow)
      const scale = document.createElement('div')
      scale.classList.add('scale')
      const img = document.createElement('div')
      img.classList.add('container')
      img.innerHTML = `<img class="images" src=${options.url} alt=""/>`
      scale.append(img)
      div.append(scale)
      document.body.append(div)
      dom = div
    }
    return dom
  }
}

class _TouchEvent {
  startX = 0
  startY = 0
  // prevY = 0
  // nextY = 0
  move = false
  scale = 1
  threshold = 0
  direction = 'down'

  constructor(options) {
    this.threshold = options.threshold || 30
  }

  touchstart = (e) => {
    console.log('touchstart')
    const { clientX, clientY } = e.touches[0]
    const { currentTarget } = e
    this.startX = clientX
    this.startY = clientY
    this.move = false
    this.scale = 1

    currentTarget.style.transition = 'none'

  }

  touchmove = (e) => {
    const { clientX, clientY } = e.touches[0]
    let diffY = clientY - this.startY
    if (!this.move && Math.abs(diffY) < this.threshold) {
      return
    }

    if (!this.move) {
      this.startY = clientY
      diffY = clientY - this.startY
      this.move = true
    }
    const diffX = clientX - this.startX
    if (diffY > 0) {
      this.direction = 'down'
    } else {
      this.direction = 'up'
    }
    const unit = 0.2 / 40
    const min_scale = 0.4
    const max_scale = 1
    this.scale = 1 - diffY * unit
    this.scale = this.scale > min_scale ? this.scale : min_scale
    this.scale = this.scale > max_scale ? max_scale : this.scale
    if (this.scale < 1) {
      const { currentTarget } = e
      currentTarget.style.transformOrigin = `${clientX}px ${clientY}px`
      currentTarget.style.transform = `scale(${this.scale})`
      currentTarget.style.left = `${diffX}px`
      currentTarget.style.right = `${-diffX}px`
      currentTarget.style.top = `${diffY}px`
      currentTarget.style.bottom = `${-diffY}px`
      e.currentTarget.parentNode.children[0].style.backgroundColor = 'rgba(255,255,255,0.5)'
    } else {
      e.currentTarget.parentNode.children[0].style.backgroundColor = 'rgba(0,0,0,1)'
    }
  }

  touchend = (e, options) => {
    const { currentTarget } = e
    currentTarget.style.transition = 'all .2s ease-out'
    const needExec = options.clicked || (this.move)
    if (!needExec) return
    options.clicked ? console.log('click') : console.log('touchend')
    if (this.scale < 0.5 || options.clicked) {
      // e.currentTarget.parentNode.style.display = 'none'
      const { target } = options
      const { top, left, width: t_width, height: t_height } = target.getClientRects()[0]
      // const { width: screen_width, height: screen_height } = document.body.getClientRects()[0]
      const scope_scale = calcScale(target.getClientRects()[0], document.body.getClientRects()[0]).min
      const scope_width = t_width * scope_scale
      const scope_height = t_height * scope_scale
      currentTarget.style.width = `${scope_width}px`
      currentTarget.style.height = `${scope_height}px`
      currentTarget.style.transform = `scale(${1 / scope_scale})`
      currentTarget.style.transformOrigin = `0px 0px`
      currentTarget.style.top = `${top}px`
      currentTarget.style.bottom = `auto`
      currentTarget.style.left = `${left}px`
      currentTarget.style.right = `auto`

      const img_width = options.store.get('img_width')
      const img_height = options.store.get('img_height')
      const img_scale = calcScale({ width: img_width, height: img_height }, { width: scope_width, height: scope_height }).max

      currentTarget.children[0].style.width = `${img_width * img_scale}px`
      currentTarget.children[0].style.height = `${img_height * img_scale}px`

      currentTarget.parentNode.children[0].style.backgroundColor = 'rgba(255,255,255,0)'
      setTimeout(() => {
        currentTarget.parentNode.style.display = 'none'
      }, 200)
    } else {
      currentTarget.parentNode.children[0].style.backgroundColor = 'rgba(0,0,0,1)'
      currentTarget.style.top = '0px'
      currentTarget.style.bottom = '0px'
      currentTarget.style.left = '0px'
      currentTarget.style.right = '0px'
      currentTarget.style.transformOrigin = ''
      currentTarget.style.transform = ''
    }
  }
}

class Store {
  store = {}
  get(propName) {
    return this.store[propName]
  }
  set(propName, value) {
    return this.store[propName] = value
  }
}

function getNum(str) { return str.replace(str, 'px') }

export default function DragSacle(options) {
  const { scope, target, url } = options

  const { left, top, height, width } = target.getClientRects()[0]

  const root = createShadow()(options)

  const [shodaw, scale] = root.children

  const touchEvent = new _TouchEvent(options)
  const store = new Store()
  options.store = store

  const touchend = (e) => touchEvent.touchend(e, options)

  const click = (e) => touchEvent.touchend(e, { ...options, clicked: true })

  scale.addEventListener('click', click)
  scale.addEventListener('touchstart', touchEvent.touchstart)
  scale.addEventListener('touchmove', touchEvent.touchmove)
  scale.addEventListener('touchend', touchend)

  return {
    removeListener: () => {
      scale.removeListener('touchstart', touchEvent.touchstart)
      scale.removeListener('touchmove', touchEvent.touchmove)
      scale.removeListener('touchend', touchend)
      scale.removeListener('click', click)
    },
    show: () => {
      const { width, height } = document.body.getClientRects()[0]
      scale.style.height = `${height}px`
      scale.style.width = `${width}px`
      scale.style.transform = ''
      scale.style.transformOrigin = ''
      scale.style.top = '0px'
      scale.style.bottom = '0px'
      scale.style.left = '0px'
      scale.style.right = '0px'
      const img = new Image()
      img.src = options.url
      img.onload = (e) => {
        const { height: img_origin_height, width: img_origin_width } = e.target
        const s = calcScale(e.target, { width, height }).min
        const img_width = img_origin_width * s
        const img_height = img_origin_height * s

        scale.children[0].style.height = `${img_height}px`
        scale.children[0].style.width = `${img_width}px`

        store.set('img_width', img_width)
        store.set('img_height', img_height)

        scale.parentNode.style.display = 'block'
        scale.parentNode.children[0].style.backgroundColor = 'rgba(0,0,0,1)'
      }
    }
  }
}

function calcScale(origin, target) {
  const width_scale = target.width / origin.width
  const height_scale = target.height / origin.height
  return {
    min: Math.min(width_scale, height_scale),// contain
    max: Math.max(width_scale, height_scale),// cover
  }
}