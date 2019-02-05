import './style.less'
import { Adapter as D } from './components'
import { createRoot } from './components/dom'
import { Store } from './components/store'
// import D from '../dist/dragScale'

const scope = document.querySelector('.scope')
const target1 = document.querySelector('.target1')
const target2 = document.querySelector('.target2')

const width_pic = 'https://ss2.baidu.com/6ONYsjip0QIZ8tyhnq/it/u=1740611183,4178547028&fm=173&app=25&f=JPEG?w=369&h=800&s=2D087033457154235EF50CDA000050B2'
// const height_pic = 'https://upload-images.jianshu.io/upload_images/80789-ef6f0a9a25981c1f.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1000/format/webp'
const height_pic = 'http://f.hiphotos.baidu.com/image/pic/item/7c1ed21b0ef41bd5f81eae7e5cda81cb38db3dee.jpg'
// const t1 = D({
//   target: target1,
//   urls: [width_pic],
//   // url: 'https://upload-images.jianshu.io/upload_images/80789-ef6f0a9a25981c1f.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1000/format/webp',
//   threshold: 30
// })

// const t2 = D({
//   target: target2,
//   // url: 'https://ss2.baidu.com/6ONYsjip0QIZ8tyhnq/it/u=1740611183,4178547028&fm=173&app=25&f=JPEG?w=369&h=800&s=2D087033457154235EF50CDA000050B2',
//   urls: [height_pic],
//   threshold: 30
// })

target1.style.backgroundImage = `url(${width_pic})`
target2.style.backgroundImage = `url(${height_pic})`

// const t = D({
//   targets: [target1, target2],
//   urls: [width_pic, height_pic],
//   thresholdX: 30,
//   thresholdY: 30,
// })
const t = new D(
  {
    targets: [target1],
    urls: [width_pic],
    thresholdX: 30,
    thresholdY: 30,
  }
)

target1.addEventListener('click', function () {
  t.show(0)
})

target2.addEventListener('click', function () {
  t.show(1)
})