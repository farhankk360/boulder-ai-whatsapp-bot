import os from 'os'
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import * as cli from '../cli/ui'
import { Message, MessageMedia } from 'whatsapp-web.js'
import { findOrCreateThread, assistantResponse, transcribeOpenAI } from '../providers/openai'
import { moderateIncomingPrompt } from './moderation'
import { ttsRequest } from '../providers/speech'

const handleMessageGPT = async (message: Message, prompt: string) => {
	try {
		cli.print(`[GPT] Received prompt from ${message.from}: ${prompt}`)
		const start = Date.now()

		await moderateIncomingPrompt(prompt)

		await message.react(`💬`)

		const meta = {
			// @ts-ignore
			name: message._data.notifyName || message.author
		}

		cli.print(`[GPT] meta info: ${JSON.stringify(meta)}`)

		const threadId = await findOrCreateThread(message.from, meta)
		const tools = [
			{
				type: 'function',
				function: {
					name: 'reactToUserMessage',
					description: 'Based on human input react to message with appropriate emoji',
					parameters: {
						type: 'object',
						properties: {
							emoji: {
								type: 'string'
							}
						}
					},
					required: ['emoji']
				}
			}
		]

		let emoji = ''
		const response = await assistantResponse(threadId, `${meta.name}: ${prompt}`, tools, async (run) => {
			if (run.required_action?.submit_tool_outputs?.tool_calls[0].function.name === 'reactToUserMessage') {
				emoji = JSON.parse(run.required_action?.submit_tool_outputs?.tool_calls[0].function.arguments || '{}').emoji

				try {
					await reactToUserMessage(message, emoji)
				} catch (error) {
					console.error('Error reacting to user message', error, emoji)
				}

				return [
					{
						id: run.required_action?.submit_tool_outputs?.tool_calls[0].id,
						output: {
							success: true
						}
					}
				]
			}
		})

		const end = Date.now() - start
		cli.print(`[GPT] Answer to ${message.from}: ${response?.text.value} | OpenAI request took ${end}ms)`)

		console.log(response?.text.value.trim(), emoji)
		if (response?.text.value.trim() === emoji) return

		// Default: Text reply
		if (response?.text?.value) {
			message.reply(response.text.value)
		}
	} catch (error) {
		console.error('An error occured', error)
		message.reply('An error occured, please contact the administrator. (' + error.message + ')')
	}
}

async function handleVoiceMessageReply(message: Message) {
	const media = await message.downloadMedia()

	// Ignore non-audio media
	if (!media || !media.mimetype.startsWith('audio/')) {
		message.reply('I can only process audio messages.')
		return
	}

	const start = Date.now()

	// Convert media to base64 string
	const mediaBuffer = Buffer.from(media.data, 'base64')

	const { text: transcribedText } = await transcribeOpenAI(mediaBuffer)

	// Check transcription is null (error)
	if (transcribedText == null) {
		message.reply("I couldn't understand what you said.")
		return
	}

	// Check transcription is empty (silent voice message)
	if (transcribedText.length == 0) {
		message.reply("I couldn't understand what you said.")
		return
	}

	// Log transcription
	cli.print(`[Transcription] Transcription response: ${transcribedText}`)

	await moderateIncomingPrompt(transcribedText)

	const meta = {
		// @ts-ignore
		name: message._data.notifyName || message.author
	}
	const threadId = await findOrCreateThread(message.from, meta)
	const response = (await assistantResponse(threadId, `${meta.name}: ${transcribedText}`)) as any

	const end = Date.now() - start
	cli.print(`[GPT] Answer to ${message.from}: ${response.text.value}  | OpenAI request took ${end}ms)`)

	// Get audio buffer
	cli.print(`[TTS] Generating audio from GPT response...`)
	const audioBuffer = await ttsRequest(response.text.value)
	// Check if audio buffer is valid
	if (audioBuffer == null || audioBuffer.length == 0) {
		message.reply(`[TTS] couldn't generate audio, please contact the administrator.`)
		return
	}

	cli.print(`[TTS] Audio generated!`)
	// Get temp folder and file path
	const tempFolder = os.tmpdir()
	const tempFilePath = path.join(tempFolder, randomUUID() + '.opus')
	// Save buffer to temp file
	fs.writeFileSync(tempFilePath, audioBuffer)
	// Send audio
	const messageMedia = new MessageMedia('audio/ogg; codecs=opus', audioBuffer.toString('base64'))
	message.reply(messageMedia)
	// Delete temp file
	fs.unlinkSync(tempFilePath)
}

async function reactToUserMessage(message: Message, emoji: string) {
	return message.react(emoji)
}

export { handleMessageGPT, handleVoiceMessageReply }
