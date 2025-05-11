/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import type { ScrcpyVideoCodecId, ScrcpyMediaStreamPacket } from '@yume-chan/scrcpy'
import { WebGLVideoFrameRenderer, WebCodecsVideoDecoder } from '@yume-chan/scrcpy-decoder-webcodecs'

self.addEventListener('message', async (e) => {
    const { codec, canvas, stream } = e.data as {
        codec: ScrcpyVideoCodecId
        canvas: OffscreenCanvas
        stream: ReadableStream<ScrcpyMediaStreamPacket>
    }

    const renderer = new WebGLVideoFrameRenderer(canvas)
    const decoder = new WebCodecsVideoDecoder({ codec, renderer })

    decoder.sizeChanged(({ width, height }) => {
        postMessage({ width, height })
    })

    console.log(stream)

    try {
        await stream.pipeTo(decoder.writable)
    } catch (e) {
        console.error('Stream pipe error:', e)
        postMessage({ error: e instanceof Error ? e.message : 'Unknown error occurred' })
    }
})
