/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

/**
 * Opus decode stream with some modifications by michioxd
 * @author @yume-chan
 * @license MIT
 * @see https://github.com/tango-adb/old-demo/blob/475465e612d2241a2802c23e19538e89ea2c4924/packages/demo/src/components/scrcpy/audio-decode-stream.ts
 */
import type { ScrcpyMediaStreamPacket } from "@yume-chan/scrcpy";
import { TransformStream } from "@yume-chan/stream-extra";

export class OpusDecodeStream extends TransformStream<ScrcpyMediaStreamPacket, Float32Array> {
    constructor(config: AudioDecoderConfig) {
        let decoder: AudioDecoder;
        super({
            start(controller) {
                decoder = new AudioDecoder({
                    error(error) {
                        console.log("audio decoder error: ", error);
                        controller.error(error);
                    },
                    output(output) {
                        // Opus decodes to "f32",
                        // converting to another format may cause audio glitches on Chrome.
                        const options: AudioDataCopyToOptions = {
                            format: "f32",
                            planeIndex: 0,
                        };
                        const buffer = new Float32Array(
                            output.allocationSize(options) / Float32Array.BYTES_PER_ELEMENT,
                        );
                        output.copyTo(buffer, options);
                        controller.enqueue(buffer);
                    },
                });
                decoder.configure(config);
            },
            transform(chunk) {
                switch (chunk.type) {
                    case "configuration":
                        // configuration data is a opus-in-ogg identification header,
                        // but stream data is raw opus,
                        // so it has no use here.
                        break;
                    case "data":
                        if (chunk.data.length === 0) {
                            break;
                        }
                        decoder.decode(
                            new EncodedAudioChunk({
                                type: "key",
                                timestamp: 0,
                                data: chunk.data,
                            }),
                        );
                }
            },
            async flush() {
                await decoder!.flush();
            },
        });
    }
}
