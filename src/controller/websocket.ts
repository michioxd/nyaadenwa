/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import type { AdbDaemonDevice, AdbPacketData, AdbPacketInit } from "@yume-chan/adb";
import { AdbPacket, AdbPacketSerializeStream, unreachable } from "@yume-chan/adb";
import { Consumable, type WrapReadableStream, type ReadableWritablePair } from "@yume-chan/stream-extra";
import { DuplexStreamFactory, ReadableStream, StructDeserializeStream, pipeFrom } from "@yume-chan/stream-extra";

export default class AdbDaemonWebSocketDevice implements AdbDaemonDevice {
    readonly serial: string;

    name: string | undefined;

    private socket: WebSocket | undefined;
    private writable: WritableStream<Consumable<Uint8Array<ArrayBufferLike>>> | undefined;
    private readable: WrapReadableStream<Uint8Array<ArrayBufferLike>> | undefined;

    constructor(url: string, name?: string) {
        this.serial = url;
        this.name = name;
    }

    async connect(): Promise<ReadableWritablePair<AdbPacketData, Consumable<AdbPacketInit>>> {
        this.socket = new WebSocket(this.serial);
        this.socket.binaryType = "arraybuffer";

        const socket = this.socket;

        if (!socket) {
            throw new Error("Failed to create WebSocket");
        }

        await new Promise((resolve, reject) => {
            socket.onopen = resolve;
            socket.onerror = () => {
                reject(new Error("WebSocket connect failed"));
            };
        });

        const duplex = new DuplexStreamFactory<Uint8Array, Consumable<Uint8Array>>({
            close: () => {
                socket.close();
            },
        });

        this.socket.onclose = () => {
            duplex.dispose().catch(unreachable);
        };

        this.readable = duplex.wrapReadable(
            new ReadableStream(
                {
                    start: (controller) => {
                        socket.onmessage = ({ data }: { data: ArrayBuffer }) => {
                            controller.enqueue(new Uint8Array(data));
                        };
                    },
                },
                {
                    highWaterMark: 16 * 1024,
                    size(chunk) {
                        return chunk.byteLength;
                    },
                },
            ),
        );

        this.writable = duplex.createWritable(
            new Consumable.WritableStream({
                write(chunk) {
                    socket.send(chunk);
                },
            }),
        );

        return {
            readable: this.readable!.pipeThrough(new StructDeserializeStream(AdbPacket)),
            //@ts-expect-error bruh
            writable: pipeFrom(this.writable!, new AdbPacketSerializeStream()),
        };
    }

    public async close() {
        this.writable?.close();
        this.readable?.cancel();
        this.socket?.close();
    }
}
