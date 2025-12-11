import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import productroutes from './product/index.js'
import db from './db/index.js'

const app = new Hono()

app.route('/api/products', productroutes);

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
