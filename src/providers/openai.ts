import fs from 'fs'
import os from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import { convertOggToWav } from '../utils'
import OpenAI from 'openai'
import config from '../config'
import { Thread } from '../database'

export const openai = new OpenAI({ apiKey: config.openAIAPIKey })

// a very hacky way of interacting with the assistant, needs optimization ASAP..
export async function assistantResponse(threadId: string, prompt: string, tools: any[] = [], callback: any = null) {
	// check if the run already exists then hold off for a bit
	const runs = await openai.beta.threads.runs.list(threadId)

	if (runs?.data?.length > 0) {
		const lastRun = runs.data[runs.data.length - 1]
		if (lastRun.status === 'in_progress' || lastRun.status === 'queued') {
			console.log('Waiting for previous run to complete', lastRun.id, lastRun.status, threadId)
			await new Promise((resolve) => setTimeout(resolve, 2000))
			return await assistantResponse(threadId, prompt, tools, callback)
		}
	}

	// Pass in the user question into the existing thread
	await openai.beta.threads.messages.create(threadId, {
		role: 'user',
		content: prompt
	})

	// Use runs to wait for the assistant response and then retrieve it
	const run = await openai.beta.threads.runs.create(threadId, {
		tools,
		assistant_id: config.openAIAssistantId,
		additional_instructions: `You will be interacting with users via whatsapp messages, 
		occasionally sprinkle emojis in conversations as means of communication.
		It is important along with your answer if you have tools available, 
		do a sentiment analysis on the human input and react with appropriate emoji.`
	})

	let actualRun = await openai.beta.threads.runs.retrieve(threadId, run.id)

	// Polling mechanism to see if actualRun is completed
	while (actualRun.status === 'queued' || actualRun.status === 'in_progress' || actualRun.status === 'requires_action') {
		// requires_action means that the assistant is waiting for the functions to be added

		if (actualRun.status === 'requires_action' && callback) {
			const outputs = await callback?.(actualRun)

			// we must submit the tool outputs to the run to continue
			await openai.beta.threads.runs.submitToolOutputs(threadId, run.id, {
				tool_outputs:
					outputs?.map((output: any) => ({
						tool_call_id: output.id,
						output: JSON.stringify(output.output)
					})) || []
			})
		}

		// keep polling until the run is completed
		await new Promise((resolve) => setTimeout(resolve, 2000))
		actualRun = await openai.beta.threads.runs.retrieve(threadId, run.id)
	}

	// Get the last assistant message from the messages array
	const messages = await openai.beta.threads.messages.list(threadId)
	// Find the last message for the current run
	const lastMessageForRun = messages.data.filter((message) => message.run_id === run.id && message.role === 'assistant').pop()
	if (lastMessageForRun) {
		const messageValue = lastMessageForRun.content[0] as {
			text: { value: string }
		}

		return messageValue
	}
}

export async function findOrCreateThread(id: string, meta: any) {
	const thread = await Thread.findOne({ where: { identifier: id } })

	if (thread) {
		console.log('Thread exists')
		return thread.openai_thread_id
	} else {
		const openaiThread = await openai.beta.threads.create({ metadata: { identifier: id, medium: 'whatsapp' } })
		const newThread = {
			identifier: id,
			openai_thread_id: openaiThread.id,
			medium: 'whatsapp'
		}

		await Thread.create(newThread)

		console.log('New thread created', newThread)

		return openaiThread.id
	}
}

export async function transcribeOpenAI(audioBuffer: Buffer): Promise<{ text: string }> {
	const tempdir = os.tmpdir()
	const oggPath = path.join(tempdir, randomUUID() + '.ogg')
	const wavFilename = randomUUID() + '.wav'
	const wavPath = path.join(tempdir, wavFilename)

	try {
		const { blobFromSync, File } = await import('fetch-blob/from.js')
		fs.writeFileSync(oggPath, audioBuffer)
		await convertOggToWav(oggPath, wavPath)

		const response = await openai.audio.transcriptions.create({
			file: new File([blobFromSync(wavPath)], wavFilename, { type: 'audio/wav' }),
			model: 'whisper-1',
			response_format: 'json'
		})

		fs.unlinkSync(oggPath)
		fs.unlinkSync(wavPath)

		return {
			text: response.text
		}
	} catch (error) {
		console.error(error)
		fs.unlinkSync(oggPath)
		fs.unlinkSync(wavPath)

		return {
			text: ''
		}
	}
}
