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
    AndroidScreenPowerMode
} from "@yume-chan/scrcpy";
import type { AdbScrcpyClient, AdbScrcpyOptionsLatest } from "@yume-chan/adb-scrcpy";
import type { ScrcpyKeyboardInjector } from "./keyboard";
import {
    PiCircleDuotone,
    PiDeviceRotateDuotone,
    PiKeyboardDuotone,
    PiPowerDuotone,
    PiSquareDuotone,
    PiTriangleDuotone,
} from "react-icons/pi";
import {
    MdArrowBackIosNew,
    MdArrowForwardIos,
    MdFullscreen,
    MdFullscreenExit,
    MdOutlineScreenshot,
    MdRotateLeft,
} from "react-icons/md";
import { ClipboardCopyIcon, FileIcon, SpeakerLoudIcon, SpeakerOffIcon, SpeakerQuietIcon } from "@radix-ui/react-icons";
import { LuMonitorOff, LuMonitorUp } from "react-icons/lu";
import { TbKeyboard, TbKeyboardOff } from "react-icons/tb";
import { RxExclamationTriangle } from "react-icons/rx";
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
    const touchAreaRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [ready, setReady] = useState(false);
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
    const [screenshoting, setScreenshoting] = useState(false);
    const keyboard = useRef<ScrcpyKeyboardInjector | null>(null);
    const client = useRef<AdbScrcpyClient<AdbScrcpyOptionsLatest<boolean>> | null>(null);
    const [showControls, setShowControls] = useState(false);
    const [fullScreen, setFullScreen] = useState(false);

    const handleFullScreen = useCallback(
        (enter: boolean) => {
            if (!playerRef.current) return;

            const player = playerRef.current;

            if (enter) {
                if (player.requestFullscreen) {
                    player.requestFullscreen();
                    // @ts-expect-error we know
                } else if (player.webkitRequestFullscreen) {
                    // @ts-expect-error we know
                    player.webkitRequestFullscreen();
                    // @ts-expect-error we know
                } else if (player.msRequestFullscreen) {
                    // @ts-expect-error we know
                    player.msRequestFullscreen();
                } else {
                    toast.error(t("failed_to_enter_full_screen"));
                }
            } else {
                document.exitFullscreen();
            }
        },
        [t],
    );

    const handleTakeScreenshot = useCallback(
        async (clipboard?: boolean) => {
            try {
                setScreenshoting(true);
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
            } finally {
                setScreenshoting(false);
            }
        },
        [dev, t],
    );
    const handleInjectSystemKey = useCallback(
        (keyCode: AndroidKeyCode, up: boolean) => {
            if (keyCode === AndroidKeyCode.AndroidBack) {
                client.current?.controller?.backOrScreenOn(up ? 1 : 0);
                return;
            }
            client.current?.controller?.injectKeyCode({
                action: up ? 1 : 0,
                keyCode,
                repeat: 0,
                metaState: 0,
            });
        },
        [client],
    );

    useEffect(() => {
        if (!canvasRef.current || !playerRef.current || !touchAreaRef.current || !ready) return;

        const canvas = canvasRef.current;
        const player = playerRef.current;
        const touchArea = touchAreaRef.current;

        let currentPointerX = 0,
            currentPointerY = 0,
            scaled = 1;

        const resizeCanvas = () => {
            if (!playerRef.current) return;
            const { clientWidth: windowWidth, clientHeight: windowHeight } = playerRef.current;
            scaled = Math.min(windowWidth / width, windowHeight / height);

            const menuPos = (width * scaled) / 2;
            const finalMenuPos = windowWidth / 2 + menuPos + 8;
            if (finalMenuPos + 56 + 8 > windowWidth) {
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
            canvas!.style.transform = `scale(${scaled})`;
            canvas!.style.transformOrigin = "center";
        };

        function handleFocus() {
            setFocused(true);
        }

        function handleBlur() {
            setFocused(false);
        }

        let lastHandleFullScreen = 0;

        function handleKeyEvent(e: KeyboardEvent) {
            if (!client.current || !keyboard.current || !focused) {
                return;
            }

            e.preventDefault();
            e.stopPropagation();

            const { type, code } = e;

            if (e.ctrlKey && e.shiftKey && e.altKey && e.code === "F11") {
                if (Date.now() - lastHandleFullScreen < 1000) {
                    return;
                }
                if (document.fullscreenElement) {
                    handleFullScreen(false);
                } else {
                    handleFullScreen(true);
                }
                lastHandleFullScreen = Date.now();
                return;
            }

            keyboard.current![type === "keydown" ? "down" : "up"](code);
        }

        function handlePointerEvent(event: PointerEvent) {
            event.preventDefault();
            event.stopPropagation();

            if (event.pointerType === "mouse" && event.button === 2) {
                return;
            }

            if (event.pointerType === "touch") {
                touchArea.setPointerCapture(event.pointerId);
            }

            const { type, clientX, clientY, button, buttons, pointerId, pressure } = event;

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
            const canvasStyle = window.getComputedStyle(canvas);
            const canvasWidth = parseFloat(canvasStyle.width) * scaled;
            const canvasHeight = parseFloat(canvasStyle.height) * scaled;

            const canvasCenterX = rect.left + rect.width / 2;
            const canvasCenterY = rect.top + rect.height / 2;

            const relativeX = clientX - canvasCenterX;
            const relativeY = clientY - canvasCenterY;

            const percentageX = 0.5 + relativeX / canvasWidth;
            const percentageY = 0.5 + relativeY / canvasHeight;

            currentPointerX = percentageX * width;
            currentPointerY = percentageY * height;

            const touchPressure = event.pointerType === "touch" ? pressure : buttons === 0 ? 0 : 1;

            client.current?.controller?.injectTouch({
                action,
                pointerId: BigInt(pointerId),
                pointerX: currentPointerX,
                pointerY: currentPointerY,
                videoWidth: width,
                videoHeight: height,
                pressure: touchPressure,
                actionButton: PointerEventButtonToAndroidButton[button],
                buttons,
            });
        }

        function handleMouseScroll(event: WheelEvent) {
            event.preventDefault();
            event.stopPropagation();

            const { deltaX, deltaY } = event;
            client.current?.controller?.injectScroll({
                pointerX: currentPointerX,
                pointerY: currentPointerY,
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

        function handleFullScreenChange() {
            setFullScreen(!!document.fullscreenElement);
        }

        const resizeObserver = new ResizeObserver(() => {
            resizeCanvas();
        });
        resizeObserver.observe(playerRef.current!);
        resizeCanvas();

        touchArea.addEventListener("pointerdown", handlePointerEvent);
        touchArea.addEventListener("pointermove", handlePointerEvent);
        touchArea.addEventListener("pointerup", handlePointerEvent);
        touchArea.addEventListener("contextmenu", (e) => e.preventDefault());
        touchArea.addEventListener("wheel", handleMouseScroll);
        touchArea.addEventListener("contextmenu", handleRightClick);
        touchArea.addEventListener("touchstart", (e) => e.preventDefault(), { passive: false });
        touchArea.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
        touchArea.addEventListener("touchend", (e) => e.preventDefault(), { passive: false });
        touchArea.addEventListener("touchcancel", (e) => e.preventDefault(), { passive: false });
        player?.addEventListener("keydown", handleKeyEvent);
        player?.addEventListener("keyup", handleKeyEvent);
        player?.addEventListener("focus", handleFocus);
        player?.addEventListener("blur", handleBlur);
        player?.addEventListener("fullscreenchange", handleFullScreenChange);

        return () => {
            resizeObserver.disconnect();
            touchArea.removeEventListener("pointerdown", handlePointerEvent);
            touchArea.removeEventListener("pointermove", handlePointerEvent);
            touchArea.removeEventListener("pointerup", handlePointerEvent);
            touchArea.removeEventListener("wheel", handleMouseScroll);
            touchArea.removeEventListener("contextmenu", handleRightClick);
            touchArea.removeEventListener("touchstart", (e) => e.preventDefault());
            touchArea.removeEventListener("touchmove", (e) => e.preventDefault());
            touchArea.removeEventListener("touchend", (e) => e.preventDefault());
            touchArea.removeEventListener("touchcancel", (e) => e.preventDefault());
            player?.removeEventListener("keydown", handleKeyEvent);
            player?.removeEventListener("keyup", handleKeyEvent);
            player?.removeEventListener("focus", handleFocus);
            player?.removeEventListener("blur", handleBlur);
            player?.removeEventListener("fullscreenchange", handleFullScreenChange);
        };
    }, [width, height, client, focused, keyboard, handleFullScreen, ready]);

    useEffect(() => {
        if (!canvasRef.current) return;

        const stream = new ScrcpyStream({
            device: dev,
            canvas: canvasRef.current,
            options: {
                maxSize: 2400,
                videoBitRate: 10_000_000,
                maxFps: 60,
            },
            onResize: (w, h) => {
                setReady(true);
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
                setError(e instanceof Error ? e.message : "Unknown error");
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();

        return () => {
            stream.stop();
            client.current = null;
            keyboard.current = null;
        };
    }, [dev]);
    return (
        <div className={cls.Player} ref={playerRef} tabIndex={0}>
            {loading && (
                <Card className={cls.Loading}>
                    <Spinner size="3" /> <Text size="1">{t("connecting_to_device")}</Text>
                </Card>
            )}
            {error && (
                <Card className={clsx(cls.Error, cls.Loading)} size="2">
                    <Flex direction="column" gap="2">
                        <Text size="2" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <RxExclamationTriangle size={18} />
                            {t("error_while_starting_mirroring")}
                        </Text>
                        <Text asChild size="1">
                            <code>{error}</code>
                        </Text>
                    </Flex>
                </Card>
            )}
            {width > 1 && client.current && ready && (
                <>
                    {!showControls && menuPosition.overflow && (
                        <Tooltip content={t("show_controls")}>
                            <div className={cls.ShowControls} onClick={() => setShowControls(!showControls)}>
                                <MdArrowBackIosNew size={18} />
                            </div>
                        </Tooltip>
                    )}
                    <Card
                        className={clsx(cls.Controls, menuPosition.overflow && cls.Overflow, showControls && cls.Show)}
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
                            {menuPosition.overflow && (
                                <Tooltip content={t("hide_controls")}>
                                    <IconButton
                                        variant="soft"
                                        color="gray"
                                        onClick={() => {
                                            setShowControls(!showControls);
                                        }}
                                    >
                                        <MdArrowForwardIos size={18} />
                                    </IconButton>
                                </Tooltip>
                            )}
                            <Tooltip content={t(fullScreen ? "exit_full_screen" : "enter_full_screen")}>
                                <IconButton
                                    variant="soft"
                                    color="gray"
                                    onClick={() => {
                                        handleFullScreen(!fullScreen);
                                    }}
                                >
                                    {fullScreen ? <MdFullscreenExit size={18} /> : <MdFullscreen size={18} />}
                                </IconButton>
                            </Tooltip>
                            <Tooltip content={t("reset_video")}>
                                <IconButton
                                    variant="soft"
                                    color="gray"
                                    onClick={() => {
                                        client.current?.controller?.resetVideo();
                                    }}
                                >
                                    <MdRotateLeft size={18} />
                                </IconButton>
                            </Tooltip>
                            <Tooltip content={t("power")}>
                                <IconButton
                                    variant="soft"
                                    color="gray"
                                    onMouseDown={() => handleInjectSystemKey(AndroidKeyCode.Power, false)}
                                    onMouseUp={() => handleInjectSystemKey(AndroidKeyCode.Power, true)}
                                >
                                    <PiPowerDuotone size={18} />
                                </IconButton>
                            </Tooltip>
                            <ContextMenu.Root>
                                <ContextMenu.Trigger disabled={screenshoting}>
                                    <IconButton variant="soft" color="gray" onClick={() => handleTakeScreenshot(false)}>
                                        <Tooltip content={t("screenshot")}>
                                            {screenshoting ? <Spinner size="2" /> : <MdOutlineScreenshot size={18} />}
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
                                    onMouseDown={() => handleInjectSystemKey(AndroidKeyCode.AndroidBack, false)}
                                    onMouseUp={() => handleInjectSystemKey(AndroidKeyCode.AndroidBack, true)}
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
                                    onMouseDown={() => handleInjectSystemKey(AndroidKeyCode.AndroidHome, false)}
                                    onMouseUp={() => handleInjectSystemKey(AndroidKeyCode.AndroidHome, true)}
                                >
                                    <PiCircleDuotone size={18} />
                                </IconButton>
                            </Tooltip>
                            <Tooltip content={t("recent_apps")}>
                                <IconButton
                                    variant="soft"
                                    color="gray"
                                    onMouseDown={() => handleInjectSystemKey(AndroidKeyCode.AndroidAppSwitch, false)}
                                    onMouseUp={() => handleInjectSystemKey(AndroidKeyCode.AndroidAppSwitch, true)}
                                >
                                    <PiSquareDuotone size={18} />
                                </IconButton>
                            </Tooltip>
                        </Flex>
                    </Card>
                </>
            )}
            <div
                className={cls.TouchArea}
                ref={touchAreaRef}
                onClick={() => {
                    playerRef.current?.focus();
                    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                    !focused && setFocused(true);
                }}
            ></div>
            <canvas className={cls.Canvas} ref={canvasRef} />
            {focused && ready && (
                <div className={cls.KeyboardIndicator}>
                    <PiKeyboardDuotone size={60} />
                </div>
            )}
        </div>
    );
}

export default memo(ScrcpyPlayer);
