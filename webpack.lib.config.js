const path = require('path')
const merge = require('webpack-merge')
const dev = require('./webpack.dev.config.js')
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = merge(dev, {
  mode: 'production',
  entry: {
    dragScale: path.resolve(__dirname, './src/components/index.ts')
  },
  output: {
    library: '[name]',
    libraryTarget: "umd",
    libraryExport: "Adapter"
  }
})

const packCss = {
  test: /\.less$/,
  use: [
    MiniCssExtractPlugin.loader,
    "css-loader",
    "less-loader"
  ]
}

module.exports.module.rules.splice(module.exports.module.rules.length - 1, 1, packCss)

delete module.exports.plugins
delete module.exports.devServer
delete module.exports.devtool

module.exports.plugins = [
  new MiniCssExtractPlugin({
    // Options similar to the same options in webpackOptions.output
    // both options are optional
    filename: "[name].css",
    chunkFilename: "[id].css"
  })
]

// console.log(JSON.stringify(module.exports, null, 2))