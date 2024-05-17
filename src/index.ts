import express from 'express'
import { start } from './whatsAppBot'
import config from './config'

const app = express()

const PORT = process.env.NODE_DOCKER_PORT || 8080

app.get('/', function (req, res) {
	return res.status(200).json({ message: `${config.botName} The AI Companion` })
})

app.listen(PORT, () => {
	console.log(`express server listening on port ${PORT}`)
})

// Start the bot
start()
