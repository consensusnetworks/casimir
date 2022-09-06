import express from 'express'
import cors from 'cors'
import { createProxyMiddleware } from 'http-proxy-middleware'

const app = express()
app.use(express.json())
app.use(cors())

app.use(
  '/',
  createProxyMiddleware({
    target: 'http://localhost:5000',
    changeOrigin: true
  })
)

app.listen(5001)
console.log('Ledger proxy listening at', 'http://localhost:5001')
