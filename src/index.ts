import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import productroutes from './product/index.js'
import userroutes from './user/index.js'
import db from './db/index.js'
import rolesroutes from './Roles/index.js'

const app = new Hono()

app.get('/', (c) => {
  return c.json({ message: 'Welcome to the Hono server!' })
});

app.route('/api/products', productroutes);
app.route('api/roles', rolesroutes);
app.route('api/users', userroutes);


serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
