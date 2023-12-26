import config from '../config'
import ElevenLabs from 'elevenlabs-node'

/**
 * @param text The sentence to be converted to speech
 * @returns Audio buffer
 */
async function ttsRequest(text: string): Promise<Buffer | null> {
	const voice = new ElevenLabs({
		apiKey: config.elevenLabsAPIKey,
		voiceId: config.elevenLabsVoiceId
	})

	const response = await voice.textToSpeechStream({
		voiceId: config.elevenLabsVoiceId,
		textInput: text,
		stability: 0.5,
		similarityBoost: 0.75,
		style: 0.5,
		speakerBoost: true,
		modelId: 'eleven_multilingual_v2',
		responseType: 'arraybuffer'
	} as any)

	return Buffer.from(response)
}

export { ttsRequest }
