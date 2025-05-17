/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import { Adb, AdbShellProtocolPtyProcess } from "@yume-chan/adb";
import { useEffect, useRef, useState } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from '@xterm/addon-fit';
import cls from "./terminal.module.scss";
import { MaybeConsumable, ReadableStreamDefaultReader, WritableStreamDefaultWriter } from "@yume-chan/stream-extra";
import { Box, Text } from "@radix-ui/themes";
import clsx from "clsx";

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
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [showIndicator, setShowIndicator] = useState(false);
    const [currentSize, setCurrentSize] = useState({ rows: 0, cols: 0 });

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

            setCurrentSize({ rows: terminal.rows, cols: terminal.cols });
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
                setCurrentSize({ rows: size.rows, cols: size.cols });
                setShowIndicator(true);
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                timeoutRef.current = setTimeout(() => {
                    setShowIndicator(false);
                }, 1000);
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
            <Box className={clsx(cls.Indicator, showIndicator && cls.Show)}>
                <Text size="6" weight="medium">
                    {currentSize.rows}x{currentSize.cols}
                </Text>
            </Box>
            <div ref={terminalRef} className={cls.Terminal}></div>
        </>
    )
}