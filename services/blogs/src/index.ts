import express from 'express'
import cors from 'cors'

const app = express()
const PORT = 3003
app.use(cors())
app.use(express.json())

app.get('/api/hackmd', async (req, res) => {
  const token = '4DXXJDRZGGRFTYTV1LH633U66W32PGKTKF6NPEQKPGNEO5TJXJ'

  const requestOptions = {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }
  // lO0eXsOqSOqOp6p8r61GIA
  const response = await fetch(
    'https://api.hackmd.io/v1/teams/consensusnetworks/notes',
    requestOptions
  )

  const data = await response.json()
  console.log('data:', data)
  res.json(data)
})

app.get('/api/hackmd/:id', async (req, res) => {
  const token = '4DXXJDRZGGRFTYTV1LH633U66W32PGKTKF6NPEQKPGNEO5TJXJ'
  const notesId = req.params.id
  const requestOptions = {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }

  const response = await fetch(
    `https://api.hackmd.io/v1/teams/consensusnetworks/notes/${notesId}`,
    requestOptions
  )

  const data = await response.json()
  console.log('data:', data)
  res.json(data)
})

app.listen(PORT, () => {
  console.log(`Express server is running on port ${PORT}`)
})
