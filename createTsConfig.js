const path = require('path')
const fs = require('fs')
const config = {
  "compilerOptions": {
    // "allowJs": true,
    // "checkJs": true,
    "target": "es5",
    experimentalDecorators: true,//启用实验性的ES装饰器。
    extendedDiagnostics: true,// 显示详细的诊段信息。
    isolatedModules: true,// 将每个文件作为单独的模块
    newLine: 'lf',
    noErrorTruncation: true,//	不截短错误消息
    noImplicitAny: true,//在表达式和声明上有隐含的 any类型时报错。
    noUnusedLocals: true,//若有未使用的局部变量则抛错
    // removeComments: true,//删除所有注释，除了以 /!*开头的版权信息。
    pretty: true,//给错误和消息设置样式，使用颜色和上下文。
  },
  "include": [
    "./src/**/*"
  ]
}

fs.writeFile(path.resolve(__dirname, 'tsconfig.json'), JSON.stringify(config), () => {
  console.log('complete')
})