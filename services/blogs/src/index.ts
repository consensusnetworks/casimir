import express from "express"
import cors from "cors"

const app = express()
const PORT = 3003
app.use(cors())
app.use(express.json())

app.get("/api/hackmd", async (req, res) => {
  const token = "4DXXJDRZGGRFTYTV1LH633U66W32PGKTKF6NPEQKPGNEO5TJXJ"

  const requestOptions = {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  }

  const response = await fetch(
    "https://api.hackmd.io/v1/teams/consensusnetworks/notes",
    requestOptions
  )

  if (!response.ok) {
    console.error(
      `Express HackMD API Error Fetching Team Notes: ${response.status} ${response.statusText}`
    )
    res.status(response.status).send("API Error")
    return
  }

  const data = await response.json()

  const filteredData = data.filter(
    (item) => item.tags.includes("blog") && item.publishedAt
  )

  res.json(filteredData)
})

app.get("/api/hackmd/:id", async (req, res) => {
  const token = "4DXXJDRZGGRFTYTV1LH633U66W32PGKTKF6NPEQKPGNEO5TJXJ"
  const notesId = req.params.id
  const requestOptions = {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  }

  const response = await fetch(
    `https://api.hackmd.io/v1/teams/consensusnetworks/notes/${notesId}`,
    requestOptions
  )

  if (!response.ok) {
    console.error(
      `Express HackMD API Error Fetching Team Note: ${response.status} ${response.statusText}`
    )
    res.status(response.status).send("API Error")
    return
  }

  const data = await response.json()
  res.json(data)
})

app.listen(PORT, () => {
  console.log(`Express server is running on port ${PORT}`)
})
