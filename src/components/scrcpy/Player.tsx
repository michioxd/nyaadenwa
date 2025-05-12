/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import { memo, useCallback, useEffect, useRef, useState } from "react";
import ScrcpyStream from "./Stream";
import type { Adb } from "@yume-chan/adb";
import cls from "@/screen/Device.module.scss";
import { Card, ContextMenu, Flex, IconButton, Spinner, Text, Tooltip } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import {
    AndroidKeyCode,
    AndroidKeyEventAction,
    AndroidMotionEventAction,
    AndroidMotionEventButton,
    AndroidScreenPowerMode,
    clamp,
} from "@yume-chan/scrcpy";
import type { AdbScrcpyClient, AdbScrcpyOptionsLatest } from "@yume-chan/adb-scrcpy";
import type { ScrcpyKeyboardInjector } from "./keyboard";
import {
    PiCircleDuotone,
    PiDeviceRotateDuotone,
    PiKeyboardDuotone,
    PiSquareDuotone,
    PiTriangleDuotone,
} from "react-icons/pi";
import { MdOutlineScreenshot } from "react-icons/md";
import { ClipboardCopyIcon, FileIcon, SpeakerLoudIcon, SpeakerOffIcon, SpeakerQuietIcon } from "@radix-ui/react-icons";
import { LuMonitorOff, LuMonitorUp } from "react-icons/lu";
import { TbKeyboard, TbKeyboardOff } from "react-icons/tb";
import clsx from "clsx";
import { toast } from "sonner";

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
    const [menuPosition, setMenuPosition] = useState<{
        pos: number;
        overflow: boolean;
    }>({
        pos: 0,
        overflow: false,
    });
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [focused, setFocused] = useState(false);
    const keyboard = useRef<ScrcpyKeyboardInjector | null>(null);
    const client = useRef<AdbScrcpyClient<AdbScrcpyOptionsLatest<boolean>> | null>(null);

    const handleTakeScreenshot = useCallback(
        async (clipboard?: boolean) => {
            try {
                const screenshot = await dev.framebuffer();
                const canvas = document.createElement("canvas");

                canvas.width = screenshot.width;
                canvas.height = screenshot.height;

                const context = canvas.getContext("2d")!;
                const imageData = new ImageData(
                    new Uint8ClampedArray(screenshot.data),
                    screenshot.width,
                    screenshot.height,
                );

                context.putImageData(imageData, 0, 0);

                if (clipboard) {
                    canvas.toBlob(async (b) => {
                        if (!b) {
                            toast.error(t("failed_to_take_screenshot"));
                            return;
                        }
                        const item = new ClipboardItem({ "image/png": b });
                        await navigator.clipboard.write([item]);
                        toast.success(t("screenshot_copied_to_clipboard"));
                    });
                    return;
                }

                const link = document.createElement("a");
                link.href = canvas.toDataURL("image/png");
                link.download = `nyaadenwa_${dev.serial}_${Date.now()}.png`;
                link.click();
                link.remove();
                canvas.remove();
            } catch (e) {
                toast.error(t("failed_to_take_screenshot"));
                console.error(e);
            }
        },
        [dev, t],
    );
    const handleInjectSystemKey = useCallback(
        async (keyCode: AndroidKeyCode) => {
            for (let i = 0; i <= 1; i++) {
                client.current?.controller?.injectKeyCode({
                    action: i === 0 ? 0 : 1,
                    keyCode,
                    repeat: 0,
                    metaState: 0,
                });
            }
        },
        [client],
    );

    useEffect(() => {
        if (!canvasRef.current || !playerRef.current) return;

        const canvas = canvasRef.current;
        const player = playerRef.current;

        const resizeCanvas = () => {
            if (!playerRef.current) return;
            const { clientWidth: windowWidth, clientHeight: windowHeight } = playerRef.current;
            const scale = Math.min(windowWidth / width, windowHeight / height);

            const menuPos = (width * scale) / 2;
            const finalMenuPos = windowWidth / 2 + menuPos + 8;
            if (finalMenuPos + 56 > windowWidth) {
                setMenuPosition({
                    pos: windowWidth - 8 - 56,
                    overflow: true,
                });
            } else {
                setMenuPosition({
                    pos: finalMenuPos,
                    overflow: false,
                });
            }

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

        function handleRightClick(event: MouseEvent) {
            event.preventDefault();
            event.stopPropagation();

            client.current?.controller?.backOrScreenOn(0);
            client.current?.controller?.backOrScreenOn(1);
        }

        const resizeObserver = new ResizeObserver(() => {
            resizeCanvas();
        });
        resizeObserver.observe(playerRef.current!);
        resizeCanvas();

        canvas.addEventListener("pointerdown", handlePointerEvent);
        canvas.addEventListener("pointermove", handlePointerEvent);
        canvas.addEventListener("pointerup", handlePointerEvent);
        canvas.addEventListener("contextmenu", (e) => e.preventDefault());
        canvas.addEventListener("wheel", handleMouseScroll);
        canvas.addEventListener("contextmenu", handleRightClick);
        player?.addEventListener("keydown", handleKeyEvent);
        player?.addEventListener("keyup", handleKeyEvent);
        player?.addEventListener("focus", handleFocus);
        player?.addEventListener("blur", handleBlur);

        return () => {
            resizeObserver.disconnect();
            canvas.removeEventListener("pointerdown", handlePointerEvent);
            canvas.removeEventListener("pointermove", handlePointerEvent);
            canvas.removeEventListener("pointerup", handlePointerEvent);
            canvas.removeEventListener("wheel", handleMouseScroll);
            canvas.removeEventListener("contextmenu", handleRightClick);
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
            {width > 1 && client.current && (
                <Card
                    className={clsx(cls.Controls, menuPosition.overflow && cls.Overflow)}
                    style={
                        {
                            "--position": `${menuPosition.pos}px`,
                        } as React.CSSProperties
                    }
                >
                    <Flex direction="column" gap="2">
                        <Tooltip content={t(focused ? "keyboard_focused" : "keyboard_unfocused")}>
                            <IconButton
                                variant="soft"
                                color={focused ? "green" : "red"}
                                onClick={() => {
                                    playerRef.current?.focus();
                                }}
                            >
                                {focused ? <TbKeyboard size={18} /> : <TbKeyboardOff size={18} />}
                            </IconButton>
                        </Tooltip>

                        <ContextMenu.Root>
                            <ContextMenu.Trigger>
                                <IconButton variant="soft" color="gray" onClick={() => handleTakeScreenshot(false)}>
                                    <Tooltip content={t("screenshot")}>
                                        <MdOutlineScreenshot size={18} />
                                    </Tooltip>
                                </IconButton>
                            </ContextMenu.Trigger>
                            <ContextMenu.Content size="1" variant="soft">
                                <ContextMenu.Item onClick={() => handleTakeScreenshot(false)}>
                                    <FileIcon />
                                    {t("save_to_file")}
                                </ContextMenu.Item>
                                <ContextMenu.Item onClick={() => handleTakeScreenshot(true)}>
                                    <ClipboardCopyIcon />
                                    {t("copy_to_clipboard")}
                                </ContextMenu.Item>
                            </ContextMenu.Content>
                        </ContextMenu.Root>
                        <Tooltip content={t("volume_up")}>
                            <IconButton
                                variant="soft"
                                color="gray"
                                onClick={() => {
                                    client.current?.controller?.injectKeyCode({
                                        action: AndroidKeyEventAction.Down,
                                        keyCode: AndroidKeyCode.VolumeUp,
                                        repeat: 0,
                                        metaState: 0,
                                    });
                                }}
                            >
                                <SpeakerLoudIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip content={t("volume_down")}>
                            <IconButton
                                variant="soft"
                                color="gray"
                                onClick={() => {
                                    client.current?.controller?.injectKeyCode({
                                        action: AndroidKeyEventAction.Down,
                                        keyCode: AndroidKeyCode.VolumeDown,
                                        repeat: 0,
                                        metaState: 0,
                                    });
                                }}
                            >
                                <SpeakerQuietIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip content={t("mute")}>
                            <IconButton
                                variant="soft"
                                color="gray"
                                onClick={() => {
                                    client.current?.controller?.injectKeyCode({
                                        action: AndroidKeyEventAction.Down,
                                        keyCode: AndroidKeyCode.VolumeMute,
                                        repeat: 0,
                                        metaState: 0,
                                    });
                                }}
                            >
                                <SpeakerOffIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip content={t("rotate_device")}>
                            <IconButton
                                variant="soft"
                                color="gray"
                                onClick={() => {
                                    client.current?.controller?.rotateDevice();
                                }}
                            >
                                <PiDeviceRotateDuotone size={18} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip content={t("turn_on_screen")}>
                            <IconButton
                                variant="soft"
                                color="gray"
                                onClick={() => {
                                    client.current?.controller?.setScreenPowerMode(AndroidScreenPowerMode.Normal);
                                }}
                            >
                                <LuMonitorUp size={18} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip content={t("turn_off_screen")}>
                            <IconButton
                                variant="soft"
                                color="gray"
                                onClick={() => {
                                    client.current?.controller?.setScreenPowerMode(AndroidScreenPowerMode.Off);
                                }}
                            >
                                <LuMonitorOff size={18} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip content={t("back")}>
                            <IconButton
                                variant="soft"
                                color="gray"
                                onClick={() => handleInjectSystemKey(AndroidKeyCode.AndroidBack)}
                            >
                                <PiTriangleDuotone
                                    size={18}
                                    style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
                                />
                            </IconButton>
                        </Tooltip>
                        <Tooltip content={t("home")}>
                            <IconButton
                                variant="soft"
                                color="gray"
                                onClick={() => handleInjectSystemKey(AndroidKeyCode.AndroidHome)}
                            >
                                <PiCircleDuotone size={18} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip content={t("recent_apps")}>
                            <IconButton
                                variant="soft"
                                color="gray"
                                onClick={() => handleInjectSystemKey(AndroidKeyCode.AndroidAppSwitch)}
                            >
                                <PiSquareDuotone size={18} />
                            </IconButton>
                        </Tooltip>
                    </Flex>
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
