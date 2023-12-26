# Boulder AI Assistant (Whatsapp Bot) 🚀

[<img src="/demo/boulder_ai_generated_avatar.jpg" width="350"/>]()
Generated using [Ideogram](https://ideogram.ai/g/D1k_F8bDRne7WTxy1QeyMA/2)

## Description

This is a personal playground project, that uses OpenAI's Assistant Api, DALL-E and ElevenLabs text to speech, in hacky ways, tied together with `whatsapp-web.js`

## Demo

### Screenshots

[<img src="/demo/screenshot_1.jpg" width="250"/>]()
[<img src="/demo/screenshot_2.jpg" width="250"/>]()

### Video

[Demo](https://github.com/Laetro-dev/LAE-Laetro/assets/26346408/62b6b81e-120b-446a-8b2c-d02a26aa67b0)

## Features

-   [OpenAI's Assistant](https://platform.openai.com/docs/assistants/overview) name Boulder persona inspired by [Bastion Game](<https://en.wikipedia.org/wiki/Bastion_(video_game)>)
-   Message handling
-   Reacting to messages using OpenAI [function](https://platform.openai.com/docs/guides/function-calling) calling capability
-   [Speech to text](https://platform.openai.com/docs/guides/speech-to-text) which uses `whisper-1` model under the hood.
-   [Text to speech](https://elevenlabs.io/voice-cloning) processing, customer voice inspired by Rucks from Bastion using ElevenLabs voice cloning
-   image generation using DALLE-2 eg.. `/imagine an astronaut lounging in space, tropical, pixel art`
-   Bot can respond to messages in 1on1 or in groups
-   Automating whatsapp using [https://wwebjs.dev/](whatsapp-web.js)
