import express from "express"
import cors from "cors"
import { HackmdArticle } from "@casimir/types"

const app = express()
app.use(cors())
app.use(express.json())

const hackmdUrl = "https://api.hackmd.io/v1/teams"

app.get("/articles", async (_req, res) => {
	const options = {
		method: "GET",
		headers: {
			Authorization: `Bearer ${process.env.HACKMD_TOKEN}`,
			"Content-Type": "application/json",
		}
	}
	const response = await fetch(`${hackmdUrl}/consensusnetworks/notes`, options)
	if (!response.ok) {
		res.status(response.status).send("Error fetching articles")
	} else {
		const data = await response.json() as HackmdArticle[]
		const hackmdArticles = data.filter((item) => item.tags.includes("blog") && item.publishedAt)
		res.json(hackmdArticles)
	}
})

app.get("/articles/:id", async (req, res) => {
	const notesId = req.params.id
	const options = {
		method: "GET",
		headers: {
			Authorization: `Bearer ${process.env.HACKMD_TOKEN}`,
			"Content-Type": "application/json",
		},
	}
	const response = await fetch(`${hackmdUrl}/consensusnetworks/notes/${notesId}`, options)
	if (!response.ok) {
		res.status(response.status).send(`Error fetching article ${notesId}`)
	} else {
		const hackmdArticle = await response.json() as HackmdArticle
		res.json(hackmdArticle)
	}
})

app.get("/health", (_req, res) => {
	res.status(200).send("OK")
})

app.listen(4001, () => {
	console.log("Blog server listening on port 4001")
})
