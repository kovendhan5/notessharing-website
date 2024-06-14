const path = require('path');
const os = require('os-browserify/browser');
const crypto = require('crypto-browserify');

module.exports = {
  // ...
  resolve: {
    fallback: {
      path: path,
      os: os,
      crypto: crypto
    }
  }
};

module.exports = {
  entry: './app.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  mode: 'development'
};