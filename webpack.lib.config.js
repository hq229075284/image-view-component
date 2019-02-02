const path = require('path')
const merge = require('webpack-merge')
const dev = require('./webpack.dev.config.js')

module.exports = merge(dev, {
  mode: 'production',
  entry: {
    dragScale: path.resolve(__dirname, './src/components/index.ts')
  },
  output: {
    libraryTarget: "commonjs2"
  },
  plugins: [],
  devServer: {}
})
delete module.exports.plugins
delete module.exports.devServer