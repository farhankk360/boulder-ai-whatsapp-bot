import qrcode from 'qrcode'
import { Client, Message, Events, LocalAuth } from 'whatsapp-web.js'
import { handleIncomingMessage } from './handlers/message'
import constants from './constants'
import * as cli from './cli/ui'
import config from './config'

let botReadyTimestamp: Date | null = null

const start = async () => {
	cli.printIntro()

	const client = new Client({
		puppeteer: {
			args: ['--no-sandbox']
		},
		authStrategy: new LocalAuth({
			dataPath: constants.sessionPath
		})
	})

	// WhatsApp auth
	client.on(Events.QR_RECEIVED, (qr: string) => {
		console.log('')
		qrcode.toString(
			qr,
			{
				type: 'terminal',
				small: true,
				margin: 2,
				scale: 1
			},
			(err, url) => {
				if (err) throw err
				cli.printQRCode(url)
			}
		)
	})

	// WhatsApp loading
	client.on(Events.LOADING_SCREEN, (percent) => {
		if (percent == '0') {
			cli.printLoading()
		}
	})

	// WhatsApp authenticated
	client.on(Events.AUTHENTICATED, () => {
		cli.printAuthenticated()
	})

	// WhatsApp authentication failure
	client.on(Events.AUTHENTICATION_FAILURE, () => {
		cli.printAuthenticationFailure()
	})

	// WhatsApp ready
	client.on(Events.READY, () => {
		// Print outro
		cli.printOutro()

		// Set bot ready timestamp
		botReadyTimestamp = new Date()
	})

	// WhatsApp message
	client.on(Events.MESSAGE_RECEIVED, async (message: any) => {
		// Ignore if message is from status broadcast
		if (message.from == constants.statusBroadcast) return

		// Ignore if it's a quoted message, (e.g. Bot reply)
		// if (message.hasQuotedMsg) return

		// Ignore if it's from me
		if (message.fromMe) return

		if ((await message.getChat()).isGroup) {
			const phoneNumber = `${config.whatsAppNumber}@c.us`
			const mentionIds = message.mentionedIds as string[]

			if (!mentionIds.includes(phoneNumber)) return

			const quotedMsg = await message.getQuotedMessage()
			handleIncomingMessage(quotedMsg ? quotedMsg : message)
		} else {
			await handleIncomingMessage(message)
		}
	})

	// Reply to own message
	client.on(Events.MESSAGE_CREATE, async (message: Message) => {
		// Ignore if message is from status broadcast
		if (message.from == constants.statusBroadcast) return

		// Ignore if it's a quoted message, (e.g. Bot reply)
		if (message.hasQuotedMsg) return

		// Ignore if it's not from me
		if (!message.fromMe) return

		await handleIncomingMessage(message)
	})

	// WhatsApp initialization
	client.initialize()
}

start()

export { botReadyTimestamp }
