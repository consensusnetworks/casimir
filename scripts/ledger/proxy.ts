// Speculos API server proxy https://speculos.ledger.com/user/api.html

import express from 'express'
import cors from 'cors'
import { createProxyMiddleware } from 'http-proxy-middleware'

const port = process.env.PUBLIC_SPECULOS_PORT || 5001

const app = express()
app.use(express.json())
app.use(cors())

app.use(
  '/',
  createProxyMiddleware({
    target: 'http://127.0.0.1:5000',
    changeOrigin: true
  })
)

app.listen(port)

setTimeout(() => {
  console.log('🌐 Ledger proxy listening at', `http://127.0.0.1:${port}`)
}, 5000)
