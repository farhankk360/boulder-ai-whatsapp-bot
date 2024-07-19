import { Message, MessageMedia } from '@periskope/whatsapp-web.js'
import { openai } from '../providers/openai'
import { moderateIncomingPrompt } from './moderation'
import * as cli from '../cli/ui'

const handleMessageDALLE = async (message: Message, prompt: string) => {
	try {
		const start = Date.now()

		cli.print(`[DALL-E] Received prompt from ${message.from}: ${prompt}`)

		await moderateIncomingPrompt(prompt)

		// Send the prompt to the API
		const response = await openai.images.generate({
			prompt: prompt,
			n: 1,
			size: '512x512',
			response_format: 'b64_json'
		})

		const end = Date.now() - start

		const base64 = response.data[0].b64_json as string
		const image = new MessageMedia('image/jpeg', base64, 'image.jpg')

		cli.print(`[DALL-E] Answer to ${message.from} | OpenAI request took ${end}ms`)

		message.reply(image)
	} catch (error: any) {
		console.error('An error occured', error)
		message.reply('An error occured, please contact the administrator. (' + error.message + ')')
	}
}

export { handleMessageDALLE }
