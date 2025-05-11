/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import { memo, useEffect, useRef, useState } from "react";
import ScrcpyStream from "./Stream";
import type { Adb } from "@yume-chan/adb";
import cls from "@/screen/Device.module.scss";
import { Card, Spinner, Text } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { AndroidMotionEventAction, AndroidMotionEventButton, clamp } from "@yume-chan/scrcpy";
import type { AdbScrcpyClient, AdbScrcpyOptionsLatest } from "@yume-chan/adb-scrcpy";
import type { ScrcpyKeyboardInjector } from "./keyboard";
import { PiKeyboardDuotone } from "react-icons/pi";

const PointerEventButtonToAndroidButton = [
    AndroidMotionEventButton.Primary,
    AndroidMotionEventButton.Tertiary,
    AndroidMotionEventButton.Secondary,
    AndroidMotionEventButton.Back,
    AndroidMotionEventButton.Forward,
];

function ScrcpyPlayer({ dev }: { dev: Adb }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const playerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [focused, setFocused] = useState(false);
    const keyboard = useRef<ScrcpyKeyboardInjector | null>(null);
    const client = useRef<AdbScrcpyClient<AdbScrcpyOptionsLatest<boolean>> | null>(null);

    useEffect(() => {
        if (!canvasRef.current || !playerRef.current) return;

        const canvas = canvasRef.current;
        const player = playerRef.current;

        const resizeCanvas = () => {
            if (!playerRef.current) return;
            const { clientWidth: windowWidth, clientHeight: windowHeight } = playerRef.current;
            const scale = Math.min(windowWidth / width, windowHeight / height);

            canvas!.style.width = `${width}px`;
            canvas!.style.height = `${height}px`;
            canvas!.style.transform = `scale(${scale})`;
            canvas!.style.transformOrigin = "center";
        };

        function handleFocus() {
            setFocused(true);
        }

        function handleBlur() {
            setFocused(false);
        }

        function handleKeyEvent(e: KeyboardEvent) {
            if (!client.current || !keyboard.current || !focused) {
                return;
            }

            e.preventDefault();
            e.stopPropagation();

            const { type, code } = e;

            keyboard.current![type === "keydown" ? "down" : "up"](code);
        }

        function handlePointerEvent(event: PointerEvent) {
            event.preventDefault();
            event.stopPropagation();

            canvas.setPointerCapture(event.pointerId);

            const { type, clientX, clientY, button, buttons } = event;

            let action: AndroidMotionEventAction;
            switch (type) {
                case "pointerdown":
                    action = AndroidMotionEventAction.Down;
                    break;
                case "pointermove":
                    if (buttons === 0) {
                        action = AndroidMotionEventAction.HoverMove;
                    } else {
                        action = AndroidMotionEventAction.Move;
                    }
                    break;
                case "pointerup":
                    action = AndroidMotionEventAction.Up;
                    break;
                default:
                    throw new Error(`Unsupported event type: ${type}`);
            }

            const rect = canvas.getBoundingClientRect();
            const percentageX = clamp((clientX - rect.x) / rect.width, 0, 1);
            const percentageY = clamp((clientY - rect.y) / rect.height, 0, 1);

            const pointerX = percentageX * width;
            const pointerY = percentageY * height;

            client.current?.controller?.injectTouch({
                action,
                pointerId: BigInt(event.pointerId),
                pointerX,
                pointerY,
                videoWidth: width,
                videoHeight: height,
                pressure: buttons === 0 ? 0 : 1,
                actionButton: PointerEventButtonToAndroidButton[button],
                buttons,
            });
        }

        function handleMouseScroll(event: WheelEvent) {
            event.preventDefault();
            event.stopPropagation();

            const { deltaX, deltaY } = event;
            client.current?.controller?.injectScroll({
                pointerX: 100,
                pointerY: 200,
                videoWidth: width,
                videoHeight: height,
                scrollX: -deltaX,
                scrollY: -deltaY,
                buttons: 0,
            });
        }

        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();

        canvas.addEventListener("pointerdown", handlePointerEvent);
        canvas.addEventListener("pointermove", handlePointerEvent);
        canvas.addEventListener("pointerup", handlePointerEvent);
        canvas.addEventListener("contextmenu", (e) => e.preventDefault());
        canvas.addEventListener("wheel", handleMouseScroll);
        player?.addEventListener("keydown", handleKeyEvent);
        player?.addEventListener("keyup", handleKeyEvent);
        player?.addEventListener("focus", handleFocus);
        player?.addEventListener("blur", handleBlur);

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            canvas.removeEventListener("pointerdown", handlePointerEvent);
            canvas.removeEventListener("pointermove", handlePointerEvent);
            canvas.removeEventListener("pointerup", handlePointerEvent);
            canvas.removeEventListener("wheel", handleMouseScroll);
            player?.removeEventListener("keydown", handleKeyEvent);
            player?.removeEventListener("keyup", handleKeyEvent);
            player?.removeEventListener("focus", handleFocus);
            player?.removeEventListener("blur", handleBlur);
        };
    }, [width, height, client, focused, keyboard]);

    useEffect(() => {
        if (!canvasRef.current) return;

        const stream = new ScrcpyStream({
            device: dev,
            canvas: canvasRef.current,
            options: {
                maxSize: 1080,
                maxFps: 60,
            },
            onResize: (w, h) => {
                setWidth(w);
                setHeight(h);
            },
            onConnected: () => {
                setLoading(false);
            },
        });

        (async () => {
            if (!canvasRef.current) return;

            try {
                client.current = await stream.start();
                keyboard.current = stream.keyboard ?? null;
            } catch (e) {
                console.error(e);
            }
        })();

        return () => {
            stream.stop();
            client.current = null;
        };
    }, [dev]);
    return (
        <div className={cls.Player} ref={playerRef} tabIndex={0}>
            {loading && (
                <Card className={cls.Loading}>
                    <Spinner size="3" /> <Text size="1">{t("connecting_to_device")}</Text>
                </Card>
            )}
            <canvas
                className={cls.Canvas}
                ref={canvasRef}
                onClick={() => {
                    playerRef.current?.focus();
                    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                    !focused && setFocused(true);
                }}
            />
            {focused && (
                <div className={cls.KeyboardIndicator}>
                    <PiKeyboardDuotone size={60} />
                </div>
            )}
        </div>
    );
}

export default memo(ScrcpyPlayer);
