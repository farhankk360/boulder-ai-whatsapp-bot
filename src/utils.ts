import ffmpeg from 'fluent-ffmpeg'

export const startsWithIgnoreCase = (str, prefix) => str.toLowerCase().startsWith(prefix.toLowerCase())

export const convertOggToWav = async (oggPath: string, wavPath: string): Promise<void> => {
	return new Promise((resolve, reject) => {
		ffmpeg(oggPath)
			.toFormat('wav')
			.outputOptions('-acodec pcm_s16le')
			.output(wavPath)
			.on('end', () => resolve())
			.on('error', (err) => reject(err))
			.run()
	})
}
