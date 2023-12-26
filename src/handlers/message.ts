import * as cli from '../cli/ui'
import { Message } from 'whatsapp-web.js'
import { startsWithIgnoreCase } from '../utils'
import { handleMessageGPT, handleVoiceMessageReply } from '../handlers/gpt'
import { handleMessageDALLE } from '../handlers/dalle'

// For deciding to ignore old messages
import { botReadyTimestamp } from '../index'
import config from '../config'

const DALLE_TRIGGER = '/imagine'

async function handleIncomingMessage(message: Message) {
	let messageString = message.body
	// Prevent handling old messages
	if (message.timestamp != null) {
		const messageTimestamp = new Date(message.timestamp * 1000)

		// If startTimestamp is null, the bot is not ready yet
		if (botReadyTimestamp == null) {
			cli.print('Ignoring message because bot is not ready yet: ' + messageString)
			return
		}

		// Ignore messages that are sent before the bot is started
		if (messageTimestamp < botReadyTimestamp) {
			cli.print('Ignoring old message: ' + messageString)
			return
		}
	}

	if (message.hasMedia) {
		await handleVoiceMessageReply(message)
		return
	}

	// DALLE (/imagine <prompt>)
	if (startsWithIgnoreCase(messageString, DALLE_TRIGGER)) {
		const prompt = messageString.substring(DALLE_TRIGGER.length + 1)
		await handleMessageDALLE(message, prompt)
		return
	}

	// GPT (only <prompt>)
	if (messageString.length) {
		if (messageString.includes(`@${config.whatsAppNumber}`)) {
			messageString = messageString.replace(`@${config.whatsAppNumber}`, config.botName).trim()
		}

		await handleMessageGPT(message, messageString)
	}
}

export { handleIncomingMessage }
