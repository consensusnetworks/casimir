// Speculos API server proxy https://speculos.ledger.com/user/api.html

import express from 'express'
import cors from 'cors'
import { createProxyMiddleware } from 'http-proxy-middleware'

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

app.listen(5001)
console.log('Ledger proxy listening on port 5001')
