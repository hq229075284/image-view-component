const path = require('path')
const merge = require('webpack-merge')
const dev = require('./webpack.dev.config.js')

module.exports = merge(dev, {
  mode: 'production',
  output: {
    libraryTarget: "commonjs2"
  },
  plugins: undefined,
  devServer: undefined
})