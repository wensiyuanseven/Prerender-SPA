var path = require('path')
var webpack = require('webpack')
var HtmlWebpackPlugin = require('html-webpack-plugin')
const PrerenderSPAPlugin = require('prerender-spa-plugin')
const Renderer = PrerenderSPAPlugin.PuppeteerRenderer
const VueLoaderPlugin = require('vue-loader/lib/plugin')

module.exports = {
  mode: process.env.NODE_ENV,
  entry: './src/main.js',
  output: {
    path: path.resolve(__dirname, './dist'),
    publicPath: '/',
    filename: 'build.js'
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]?[hash]'
        }
      },
      {
        test: /\.css$/,
        use: ['vue-style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    alias: {
      vue$: 'vue/dist/vue.esm.js'
    }
  },
  devServer: {
    historyApiFallback: true,
    noInfo: false
  },
  devtool: '#eval-source-map',
  plugins: [new VueLoaderPlugin()]
}
if (process.env.NODE_ENV === 'production') {
  module.exports.devtool = '#source-map'
  module.exports.plugins = (module.exports.plugins || []).concat([
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"'
      }
    }),
    new HtmlWebpackPlugin({
      title: 'PRODUCTION prerender-spa-plugin',
      template: 'index.html',
      filename: path.resolve(__dirname, 'dist/index.html'), // 输出到了dist目录一个模板
      favicon: 'favicon.ico'
    }),
    new PrerenderSPAPlugin({
      staticDir: path.join(__dirname, 'dist'),
      routes: ['/', '/about', '/contact'],
      postProcess (renderedRoute) {
        // renderedRoute.route = renderedRoute.originalRoute
        // 重点
        // Remove /index.html from the output path if the dir name ends with a .html file extension.
        // For example: /dist/dir/special.html/index.html -> /dist/dir/special.html
        // if (renderedRoute.route.endsWith('.html')) {
        //   renderedRoute.outputPath = path.join(
        //     __dirname,
        //     'dist',
        //     renderedRoute.route
        //   )
        // }
        return renderedRoute
      },
      postProcessHtml: function (context) {
        var titles = {
          '/': '首页',
          '/about': '关于',
          '/contact': '链接'
        }
        return context.html.replace(
          /<title>[^<]*<\/title>/i,
          '<title>' + titles[context.route] + '</title>'
        )
      },
      renderer: new Renderer({
        // 触发渲染的时间，用于获取数据后再保存渲染结果
        renderAfterTime: 5000,
        // 所采用的渲染引擎
        injectProperty: '__PRERENDER_INJECTED',
        inject: {
          foo: 'bar'
        },
        headless: true
        // renderAfterDocumentEvent: 'render-event'
      })
    })
  ])
} else {
  // NODE_ENV === 'development'
  module.exports.plugins = (module.exports.plugins || []).concat([
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"development"'
      }
    }),
    new HtmlWebpackPlugin({
      title: 'DEVELOPMENT prerender-spa-plugin',
      template: 'index.html',
      filename: 'index.html',
      favicon: 'favicon.ico'
    })
  ])
}
