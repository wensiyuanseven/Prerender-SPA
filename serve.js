let port = 8097
const Koa = require('koa')
const Router = require('koa-router')
const KoaStatic = require('koa-static')
const app = new Koa()
const router = new Router()
const fs = require('fs')
const path = require('path')

// koa只能用promise
router.get('/', async ctx => {
  ctx.body = await fs.readFileSync('./dist/index.html', 'utf8')
})

// 中间件
app.use(router.routes())

// koa静态服务中间件 会去当前目录查找所有文件
app.use(KoaStatic(path.resolve(__dirname, 'dist')))
// 中间件 当找不到路由时会走此逻辑
app.use(async ctx => {
  // ctx.body = await fs.readFileSync('./dist/about.html', 'utf8')
  ctx.body = '<h1>404</h1>`'
})
app.listen(port, () => {
  console.log('服务器开启成功', `http://localhost:${port}/`)
})
