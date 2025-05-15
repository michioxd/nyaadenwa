/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import { DefaultServerPath, ScrcpyVideoCodecId } from "@yume-chan/scrcpy";
import { AdbScrcpyClient, AdbScrcpyOptionsLatest } from "@yume-chan/adb-scrcpy";
import type { Adb } from "@yume-chan/adb";
import { WebCodecsVideoDecoder } from "@yume-chan/scrcpy-decoder-webcodecs";
import { Float32PcmPlayer } from "./audio/player";
import PushServer from "./PushServer";
import { OpusDecodeStream } from "./audio/decoder";
import { WritableStream } from "@yume-chan/stream-extra";
import StreamWorker from "./video?worker";
import { ScrcpyKeyboardInjector } from "./keyboard";

export default class ScrcpyStream {
    private device: Adb;
    private canvas: HTMLCanvasElement;
    private options: AdbScrcpyOptionsLatest.Init<boolean>;
    private client?: AdbScrcpyClient<AdbScrcpyOptionsLatest<boolean>>;
    private codec: ScrcpyVideoCodecId = ScrcpyVideoCodecId.H264;
    private audioPlayer?: Float32PcmPlayer;
    private onResize?: (width: number, height: number) => void;
    private onConnected?: () => void;
    private streamWorker?: Worker;
    public keyboard?: ScrcpyKeyboardInjector;
    constructor({
        device,
        canvas,
        options,
        codec,
        onResize,
        onConnected,
    }: {
        device: Adb;
        canvas: HTMLCanvasElement;
        options: AdbScrcpyOptionsLatest.Init<boolean>;
        codec?: ScrcpyVideoCodecId;
        onResize?: (width: number, height: number) => void;
        onConnected?: () => void;
    }) {
        this.device = device;
        this.canvas = canvas;
        this.options = options;
        this.codec = codec ?? ScrcpyVideoCodecId.H264;
        this.onResize = onResize;
        this.onConnected = onConnected;

        if (!WebCodecsVideoDecoder.isSupported) {
            throw new Error("WebCodecs is not supported");
        }
    }

    public async start() {
        if (!(await PushServer(this.device))) {
            throw new Error("Failed to push server, please check console for more details");
        }
        this.client = await AdbScrcpyClient.start(
            this.device,
            DefaultServerPath,
            new AdbScrcpyOptionsLatest({
                logLevel: "info",
                maxSize: 2400,
                maxFps: 60,
                sendFrameMeta: true,
                displayId: 0,
                control: true,
                video: true,
                videoBitRate: 10_000_000,
                videoSource: "display",
                audioCodec: "opus",
                audio: true,
                audioBitRate: 128_000,
                audioSource: "playback",
                ...this.options,
            }),
        );

        this.client.output.pipeTo(
            new WritableStream<string>({
                write: (line) => {
                    console.log(`[stream][${this.device.serial}]`, line);
                },
            }),
        );

        this.keyboard = new ScrcpyKeyboardInjector(this.client);

        this.initVideo();
        this.initAudio();

        return this.client;
    }

    public async stop() {
        this.client?.close();
        this.audioPlayer?.stop();
        this.audioPlayer = undefined;
        this.streamWorker?.terminate();
        this.streamWorker = undefined;
        this.keyboard?.dispose();
        this.keyboard = undefined;
        this.client = undefined;
    }

    private async initVideo() {
        this.streamWorker = new StreamWorker();
        const offscreenCanvas = this.canvas.transferControlToOffscreen();
        const stream = await this.client?.videoStream;
        if (!stream) {
            return;
        }
        this.streamWorker.postMessage(
            {
                codec: this.codec,
                canvas: offscreenCanvas,
                stream: stream.stream,
            },
            [offscreenCanvas, stream.stream],
        );

        this.streamWorker.onmessage = (e) => {
            const { width, height, error } = e.data;
            this.onConnected?.();
            if (error) {
                throw new Error(`Stream worker error: ${error}`);
            }
            this.onResize?.(width, height);
        };
    }

    private async initAudio() {
        this.client?.audioStream?.then(async (stream) => {
            if (!stream) {
                console.warn("No audio stream, returned: ", stream);
                return;
            }

            if (stream.type !== "success") {
                console.warn("Failed to get audio stream, returned: ", stream);
                return;
            }

            const audioPlayer = new Float32PcmPlayer(48000, 2);
            this.audioPlayer = audioPlayer;

            const [playbackStream] = stream.stream.tee();

            playbackStream
                .pipeThrough(
                    new OpusDecodeStream({
                        codec: stream.codec.webCodecId,
                        numberOfChannels: 2,
                        sampleRate: 48000,
                    }),
                )
                .pipeTo(
                    new WritableStream<Float32Array>({
                        write(packet) {
                            audioPlayer.feed(packet);
                        },
                    }),
                );

            await audioPlayer.start();
        });
    }
}
