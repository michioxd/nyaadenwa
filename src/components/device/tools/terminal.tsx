/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import { Adb, AdbShellProtocolPtyProcess } from "@yume-chan/adb";
import { useEffect, useRef } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from '@xterm/addon-fit';
import cls from "./terminal.module.scss";
import { MaybeConsumable, ReadableStreamDefaultReader, WritableStreamDefaultWriter } from "@yume-chan/stream-extra";

export default function Terminal({ adb }: { adb: Adb }) {
    const terminalRef = useRef<HTMLDivElement>(null);
    const fitAddon = useRef<FitAddon>(new FitAddon());
    const xtermRef = useRef<XTerm>(new XTerm({
        fontSize: 12,
        cursorBlink: true,
        fontFamily: "monospace",
        theme: {
            background: "#00000000",
            foreground: "#ffffff",
        },
        allowTransparency: true
    }));

    useEffect(() => {
        if (!terminalRef.current) return;
        const terminal = xtermRef.current;
        terminal.loadAddon(fitAddon.current);
        terminal.open(terminalRef.current);
        fitAddon.current.fit();

        let pty: AdbShellProtocolPtyProcess | undefined = undefined,
            outputActive = true,
            writer: WritableStreamDefaultWriter<MaybeConsumable<Uint8Array<ArrayBufferLike>>> | undefined = undefined,
            reader: ReadableStreamDefaultReader<Uint8Array<ArrayBufferLike>> | undefined = undefined;

        (async () => {
            pty = await adb.subprocess.shellProtocol?.pty({
                terminalType: 'xterm-256color',
                command: ['/system/bin/sh']
            });

            await pty?.resize(terminal.rows, terminal.cols);

            reader = pty?.output.getReader();

            (async () => {
                if (!reader) return;
                while (outputActive) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    if (value) {
                        terminal.write(new Uint8Array(value));
                    }
                }
                reader.releaseLock();
            })();

            writer = pty?.input.getWriter();
            const encoder = new TextEncoder();
            const onData = async (data: string) => {
                if (writer) {
                    await writer.write(encoder.encode(data));
                }
            };
            terminal.onData(onData);

            terminal.onResize((size) => {
                pty?.resize(size.rows, size.cols);
            });
        })();
        return () => {
            outputActive = false;
            reader?.cancel();
            writer?.close();
            terminal.dispose();
            pty?.kill();
            fitAddon.current.dispose();
        };
    }, []);

    useEffect(() => {
        if (!terminalRef.current) return;
        const handleResize = () => {
            fitAddon.current.fit();
        }
        const observer = new ResizeObserver(handleResize);
        observer.observe(terminalRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <>
            <div ref={terminalRef} className={cls.Terminal}></div>
        </>
    )
}