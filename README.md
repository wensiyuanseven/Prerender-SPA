
## 使用

- npm install  下载依赖
- npm run dev  启动客户端服务
- npm run build  生成预渲染页面
- npm run serve  开启http-server服务,监控生成的dist目录
- npm run node  开启Koa服务,监控生成的dist目录

## 指南

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/08a41c015d324ad3b662f85fc70409f8~tplv-k3u1fbpfcp-watermark.image)

## 预渲染原理

在webpack打包结束并生成文件后（after-emit hook），会启动一个server模拟网站的运行，用puppeteer（google官方的headless 无头浏览器浏览器）访问指定的页面route，得到相应的html结构，并将结果输出到指定目录，过程类似于爬虫。

## 预渲染应用场景

1. **seo优化** 对于一些动态数据利用`enderAfterTime`也可以进行预渲染出来。当动态数据渲染出来之后，客户端代码比如`bundle.js`会立马接管dom操作。对于spa优化可谓是非常方便。

> 对于meta头的seo优化会结合`vue-meta-info`插件来优化
[https://mp.weixin.qq.com/s/lM808MxUu6tp8zU8SBu3sg](https://mp.weixin.qq.com/s/lM808MxUu6tp8zU8SBu3sg)

2. **骨架屏。**
两种思路：

- 把骨架屏当做预渲染页面，当ajax获取到数据之后再把骨架屏替换掉
- prerender-spa-plugin提供了`postProcessHtml`钩子

```js
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
      }
```

预渲染不适用经常变化的数据，比如说股票代码网站，天气预报网站。因为此时的数据是动态的，而预渲染时已经生成好了dom节点。如果要兼容seo可以使用SSR。
预渲染不适用大量的路由页面,比如成千上百个路由，此时打包后预渲染将会非常慢。
预渲染最好的应用场景是需要seo的活动页面，配合vue-meta-info插件优化meta，开箱即用。

此钩子会返回转义之后的静态页面，配置好的路由都会走此回调，对于动态生成骨架屏，这也是一种思路,转义之后的字符处理起来比较麻烦(有待考究)

## 如何把异步数据渲染成静态页面

三种方案

1. plugin中设置renderAfterTime：5000   //触发渲染的时间，用于获取数据后再保存渲染结果
2. plugin中设置

  ```js
  renderAfterDocumentEvent: 'render-event'
  ```

  根组件中设置

  ```js
  new Vue({
    el: '#app',
    mounted () {
      setTimeout(() => {
        document.dispatchEvent(new Event('render-event'))
      }, 5000)
    }
})
 ```

 > 注意 不是在根组件中设置此事件无效（比如你想在ajax获取之后再再派发事件，此时并不会触发预渲染）

 3. plugin中设置

   ```js
   renderAfterElementExists: 'my-app-element'
   ```

 会等待dom节点class为my-app-element生成功之后再进行预渲染

## 生成的路由跳转新页面

 ```html
    <router-link to="/about" target="_blank" >About</router-link>
 ```

## 如何处理某些节点是否需要预渲染

 plugin中配置

 ```js
   renderer: new Renderer({
        renderAfterTime: 5000,
        injectProperty: '__PRERENDER_INJECTED',
        inject: {
          foo: 'bar'
        }
      })
 ```

 页面中使用

  ```js
    setTimeout(() => {
       if (window['__PRERENDER_INJECTED']) {
         return
       }
      this.data = '我是异步渲染出来的数据'
    }, 3000)
  },
  ```

  > 预渲染会在5秒后完成 并且不会对data数据进行预渲染

## prerender-spa-plugin的一些坑

### 路由生成对应的页面(.html)时某些数据没有被渲染出来

 在根组件上添加`data-server-rendered ='true'`

 ```html
   <div id="app" data-server-rendered="true"></>
 ```

### 直接访问某个为.html文件的后缀时只能渲染出静态页面，不会渲染到对应的路由

### style加载了2次 官方bug并未解决

### 刷新总是会闪一下首页

 这个是服务端渲染后,样式文件没跟上导致的,css要提取成一个文件就好了,了解一下这个plugin ExtractTextPlugin

### 配置不生成文件夹，值生成html文件时

 ```js
   postProcess (renderedRoute) {
        // 重点
        // Remove /index.html from the output path if the dir name ends with a .html file extension.
        // For example: /dist/dir/special.html/index.html -> /dist/dir/special.html
        if (renderedRoute.route.endsWith('.html')) {
          renderedRoute.outputPath = path.join(
            __dirname,
            'dist',
            renderedRoute.route
          )
        }
        return renderedRoute
    }
 ```

 打包之后会报错
 解决办法：去掉data-server-rendered="true"
 但是此时又会出现路由对应的路由无法渲染的问题。无解。

## 未解决的问题

 没有正确渲染对应.html后缀的文件
 比如`http://localhost:8096/about/index.html`
 此文件因为没有被路由/about所查到，所以，只能渲染静态的html文件。（可能需要服务端或ngix支持才能正确渲染。

## 最后

尽量不要生成不带文件夹的html页面，会出现一些怪异的问题。
尽量不要直接访问.html后缀的文件。因为.html后缀的文件内容是静态的，并且没有对应路由,也会造成渲染问题。


## 参考

<https://github.com/chrisvfritz/prerender-spa-plugin>

<https://juejin.im/post/6844903737031409677>

<https://github.com/cisen/blog/issues/570>

<https://www.cnblogs.com/chuaWeb/p/prerender-plugin.html>

<https://zhuanlan.zhihu.com/p/29148760>

<https://www.cnblogs.com/tugenhua0707/p/10725888.html>

<https://zhuanlan.zhihu.com/p/116102502>
