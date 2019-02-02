const transitionDuration = 300
const transition = `all ${transitionDuration}ms ease-out`
function createShadow() {
  let dom
  return function create(options) {
    if (!dom) {
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
  direction = 'down'

  constructor(options) {
    this.thresholdX = options.thresholdX || 30
    this.thresholdY = options.thresholdY || 30
  }

  touchstart = (e) => {
    console.log('touchstart')
    const { clientX, clientY } = e.touches[0]
    const { currentTarget } = e
    this.startX = clientX
    this.startY = clientY
    this.move = false
    this.moveDirection = 'horizon'// vertical or horizon
    this.scale = 1

    currentTarget.style.transition = 'none'

  }

  touchmove = (e, options) => {
    const { clientX, clientY } = e.touches[0]
    let diffX = clientX - this.startX
    let diffY = clientY - this.startY
    if (!this.move) {
      if (Math.abs(diffY) < this.thresholdY && Math.abs(diffX) < this.thresholdX) {// 还未到阈值
        return
      } else if (Math.abs(diffX) >= this.thresholdX) {
        this.moveDirection = 'horizon'
      } else if (Math.abs(diffY) >= this.thresholdY) {
        // 开始向下移动进行缩放
        this.moveDirection = 'vertical'
        this.startX = clientX
        this.startY = clientY
        diffX = clientX - this.startX
        diffY = clientY - this.startY
      }
      this.move = true
    }
    console.log(this.moveDirection)
    // if (!this.move) {
    //   this.startY = clientY
    //   diffY = clientY - this.startY
    //   this.move = true
    // }
    // if (diffY > 0) {
    //   this.direction = 'down'
    // } else {
    //   this.direction = 'up'
    // }
    if (this.moveDirection === 'vertical') {
      const unit = 0.2 / 40
      const min_scale = 0.4
      const max_scale = 1
      let _scale
      this.scale = _scale = 1 - diffY * unit
      if (_scale > 1) _scale = 1
      if (_scale < 0) _scale = 0
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
        e.currentTarget.parentNode.children[0].style.backgroundColor = `rgba(255,255,255,${_scale})`
      } else {
        e.currentTarget.parentNode.children[0].style.backgroundColor = 'rgba(0,0,0,1)'
      }
    } else if (this.moveDirection === 'horizon') {
      const list = e.currentTarget.children[0]
      const showIndex = options.store.get('showIndex')
      const left = -showIndex * document.body.offsetWidth
      list.style.left = `${left + diffX}px`
    }
  }

  touchend = (e, options) => {
    const { currentTarget: scope } = e
    scope.style.transition = transition
    const list = scope.children[0]

    const needExec = options.clicked || (this.move)
    if (!needExec) return
    options.clicked ? console.log('click') : console.log('touchend')
    if (options.clicked || this.moveDirection === 'vertical') {
      if (this.scale < 0.5 || options.clicked) {
        // e.scope.parentNode.style.display = 'none'
        const { targets, store } = options
        const target = targets[options.store.get('showIndex')]
        const { top, left, width: t_width, height: t_height } = target.getClientRects()[0]
        // const { width: screen_width, height: screen_height } = document.body.getClientRects()[0]
        const scope_scale = calcScale(target.getClientRects()[0], document.body.getClientRects()[0]).min
        const scope_width = t_width * scope_scale
        const scope_height = t_height * scope_scale
        scope.style.width = `${scope_width}px`
        scope.style.height = `${scope_height}px`
        scope.style.transform = `scale(${1 / scope_scale})`
        scope.style.transformOrigin = `0px 0px`
        scope.style.top = `${top}px`
        scope.style.bottom = `auto`
        scope.style.left = `${left}px`
        scope.style.right = `auto`

        const showIndex = store.get('showIndex')
        list.style.left = `-${showIndex * scope_width}px`
        list.style.width = `${list.children.length * scope_width}px`
        list.style.transition = transition

        const items = list.children
        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          item.style.width = `${scope_width}px`
          // item.style.height = `${scope_height}px`
          item.style.backgroundSize = 'cover'
          item.style.transition = transition
        }

        scope.parentNode.children[0].style.backgroundColor = 'rgba(255,255,255,0)'
        setTimeout(() => {
          scope.parentNode.style.display = 'none'
        }, transitionDuration)
      } else {
        scope.style.transition = transition
        scope.style.transform = ''
        scope.style.transformOrigin = '0px 0px'
        scope.style.top = '0px'
        scope.style.left = '0px'
        scope.parentNode.children[0].style.backgroundColor = 'rgba(0,0,0,1)'
      }
    } else if (this.moveDirection === 'horizon') {
      const left = getNum(window.getComputedStyle(list).left)
      const body_width = document.body.offsetWidth
      let showIndex = Math.round(-left / body_width)
      if (showIndex + 1 > options.targets.length) {//已滑到最右侧
        showIndex = options.targets.length - 1
      }
      if (showIndex < 0) {//已滑到最左侧
        showIndex = 0
      }
      const prevShowIndex = options.store.get('showIndex')
      if (prevShowIndex !== showIndex) {
        options.store.set('showIndex', showIndex)
      }
      list.style.left = `-${showIndex * body_width}px`
      list.style.transition = transition
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

function getNum(str) { return parseFloat(str.replace('px', '')) }

export default function DragSacle(options) {
  const { targets, urls, showIndex = 0 } = options

  const root = createShadow()(options)

  const [shodaw, scope] = root.children

  // resetItemStyle(scope.children[0].children, urls)

  const touchEvent = new _TouchEvent(options)
  const store = new Store()

  options.store = store

  const touchmove = (e) => touchEvent.touchmove(e, options)
  const touchend = (e) => touchEvent.touchend(e, options)

  const click = (e) => touchEvent.touchend(e, { ...options, clicked: true })

  scope.addEventListener('click', click)
  scope.addEventListener('touchstart', touchEvent.touchstart)
  scope.addEventListener('touchmove', touchmove)
  scope.addEventListener('touchend', touchend)

  return {
    removeListener: () => {
      scope.removeListener('touchstart', touchEvent.touchstart)
      scope.removeListener('touchmove', touchmove)
      scope.removeListener('touchend', touchend)
      scope.removeListener('click', click)
    },
    show: (showIndex) => {
      store.set('showIndex', showIndex)
      const cb1 = resetScopeStyle(scope, options)
      const cb2 = resetListStyle(scope.children[0], options)
      const cb3 = resetItemStyle(scope.children[0].children, options)
      setTimeout(() => {
        cb1.forEach(fn => fn())
        cb2.forEach(fn => fn())
        cb3.forEach(fn => fn())
      }, 16.7)
      // const img = new Image()
      // img.src = options.url
      // img.onload = (e) => {
      //   const { height: img_origin_height, width: img_origin_width } = e.target
      //   const s = calcScale(e.target, { width, height }).min
      //   const img_width = img_origin_width * s
      //   const img_height = img_origin_height * s

      //   scope.children[0].style.height = `${img_height}px`
      //   scope.children[0].style.width = `${img_width}px`

      //   store.set('img_width', img_width)
      //   store.set('img_height', img_height)

      //   scope.parentNode.style.display = 'block'
      //   scope.parentNode.children[0].style.backgroundColor = 'rgba(0,0,0,1)'
      // }
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

function resetScopeStyle(scope, options) {
  const { targets, store } = options
  const target = targets[store.get('showIndex')]
  const { top, left, width: t_width, height: t_height } = target.getClientRects()[0]
  const { width, height } = document.body.getClientRects()[0]
  const scale = calcScale({ width: t_width, height: t_height }, { width, height }).min
  scope.style.top = `${top}px`
  scope.style.left = `${left}px`
  scope.style.width = `${t_width * scale}px`
  scope.style.height = `${t_height * scale}px`
  scope.style.transform = `scale(${1 / scale})`
  scope.parentNode.style.display = 'block'
  scope.parentNode.children[0].style.backgroundColor = 'rgba(0,0,0,0)'
  scope.style.transformOrigin = '0px 0px'
  // scope.style.transitionDuration = '3000ms'
  store.set('scope width', t_width * scale)
  // console.log(t_width * scale)

  return [function cb() {
    scope.style.transition = transition
    scope.style.height = `${height}px`
    scope.style.width = `${width}px`
    scope.style.transform = ''
    scope.style.transformOrigin = '0px 0px'
    scope.style.top = '0px'
    scope.style.left = '0px'
    scope.parentNode.children[0].style.backgroundColor = 'rgba(0,0,0,1)'
  }]
}

function resetItemStyle(items, options) {
  const { store, urls } = options
  let { width, height } = document.body.getClientRects()[0]
  // let { marginTop, marginLeft, marginRight, marginBottom, } = window.getComputedStyle(document.body)
  // marginTop = getNum(marginTop)
  // marginBottom = getNum(marginBottom)
  // marginLeft = getNum(marginLeft)
  // marginRight = getNum(marginRight)
  // width = width + marginLeft + marginRight
  // height = height + marginTop + marginBottom
  const cbs = []
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    item.style.width = `${store.get('scope width')}px`
    // item.style.height = `${height}px`
    item.style.backgroundSize = 'contain'
    item.style.backgroundImage = `url(${urls[i]})`
    item.style.transition = 'none'
    cbs.push(() => {
      item.style.transition = transition
      item.style.width = `${width}px`
      // item.style.height = `${height}px`
    })
  }
  return cbs
}

function resetListStyle(list, options) {
  const { store } = options
  const showIndex = store.get('showIndex')
  const scope_width = store.get('scope width')
  // console.log(scope_width)
  let { width, height } = document.body.getClientRects()[0]
  list.style.transition = 'none'
  list.style.left = `-${scope_width * showIndex}px`
  list.style.width = `${list.children.length * scope_width}px`
  return [() => {
    // debugger
    list.style.transition = transition
    list.style.left = `-${width * showIndex}px`
    list.style.width = `${list.children.length * width}px`
  }]
}