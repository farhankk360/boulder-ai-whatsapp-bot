import express from 'express'
import cron from 'node-cron'
import { start } from './whatsAppBot'
import config from './config'

const app = express()

const PORT = process.env.PORT || 3000

app.get('/', function (req, res) {
	return res.status(200).json({ message: `${config.botName} The AI Companion` })
})

app.listen(PORT, () => {
	console.log(`express server listening on port ${PORT}`)
})

// Start the bot
start()

if (config.keepServerAlive === 'true' && config.serverPingUrl) {
	// ping the server every 10 minutes to keep it alive
	cron.schedule('*/10 * * * *', () => {
		console.log('pinging server...')

		fetch(config.serverPingUrl)
			.then((res) => res.text())
			.then((body) => console.log(body))
			.catch((err) => console.error(err))
	})
}
