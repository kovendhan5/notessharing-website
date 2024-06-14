const path = require('path');
const Dotenv = require('dotenv-webpack');

module.exports = {
  entry: './app.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  mode: 'development',
  resolve: {
    fallback: {
      os: require.resolve('os-browserify/browser'),
      crypto: require.resolve('crypto-browserify')
    }
  },
  plugins: [
    new Dotenv()
  ]
};
