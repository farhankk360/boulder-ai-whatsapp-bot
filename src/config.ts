import process from 'process'

// Environment variables
import dotenv from 'dotenv'
dotenv.config()

// Config
export const config = {
	openAIAPIKey: process.env.OPENAI_API_KEY || '',
	openAIModel: process.env.OPENAI_GPT_MODEL || 'gpt-3.5-turbo',
	openAIAssistantId: process.env.OPENAI_ASSISTANT_ID || '',
	elevenLabsAPIKey: process.env.ELEVENLABS_API_KEY || '',
	elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_ID || '',
	whatsAppNumber: process.env.WHATSAPP_NUMBER || '',
	botName: process.env.BOT_NAME || 'Boulder',
	serverPingUrl: process.env.SERVER_PING_URL || '',
	keepServerAlive: process.env.KEEP_SERVER_ALIVE || false,
	dbSchema: process.env.DB_SCHEMA || 'postgres',
	dbHost: process.env.DB_HOST || 'localhost',
	dbPort: process.env.DB_PORT || 5432,
	dbUser: process.env.DB_USER || 'postgres',
	dbPassword: process.env.DB_PASSWORD || ''
}

export default config
