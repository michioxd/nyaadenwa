/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import cls from "@/screen/Device.module.scss";
import { Box, Button, Card, DropdownMenu, Flex, IconButton, Text, Tooltip } from "@radix-ui/themes";
import { PiFolderOpenDuotone, PiInfoDuotone, PiPowerDuotone, PiTerminalWindowDuotone, PiX } from "react-icons/pi";
import { useTranslation } from "react-i18next";
import { MouseEvent, MouseEventHandler, useEffect, useMemo, useRef, useState } from "react";
import { accentColorPropDef } from "@radix-ui/themes/src/props/color.prop.ts";
import { BiWindow, BiWindows } from "react-icons/bi";
import clsx from "clsx";
import { MdApps, MdFullscreen, MdFullscreenExit } from "react-icons/md";
import { Adb } from "@yume-chan/adb";
import Power from "./sidebar/Power";
import Terminal from "./tools/terminal";
import FileManager from "./tools/fm";
import ToolsAppManager from "./tools/pm";
import { TConfig } from "@/controller/config";

export default function DeviceTools({
    sidebarLevel,
    adb,
    close,
    mainDeviceSize,
    deviceHash,
    config,
}: {
    sidebarLevel: number;
    adb: Adb;
    close: () => void;
    mainDeviceSize: { w: number; h: number };
    deviceHash: string;
    config: TConfig;
}) {
    const { t } = useTranslation();
    const [section, setSection] = useState(parseInt(localStorage.getItem("sbs_" + deviceHash) ?? "0"));
    const toolsRef = useRef<HTMLDivElement>(null);
    const [toolFullScreen, setToolFullScreen] = useState(localStorage.getItem("tfs_" + deviceHash) === "true");
    const [toolFloating, setToolFloating] = useState(localStorage.getItem("tfl_" + deviceHash) === "true");

    const [resizing, setResizing] = useState(false);
    const [toolWidth, setToolWidth] = useState(parseInt(localStorage.getItem(`tool_width_${deviceHash}`) ?? "0"));
    const startXRef = useRef(0);
    const startWidthRef = useRef(0);

    const sbItem = useMemo<
        {
            icon: React.ReactNode;
            text: string;
            color: (typeof accentColorPropDef)["color"]["values"][number];
            onClick?: () => void;
        }[]
    >(
        () => [
            {
                icon: <PiInfoDuotone size={20} />,
                text: "device_info",
                color: "cyan",
            },
            {
                icon: <PiTerminalWindowDuotone size={20} />,
                text: "terminal",
                color: "cyan",
            },
            {
                icon: <PiFolderOpenDuotone size={20} />,
                text: "file_manager",
                color: "cyan",
            },
            {
                icon: <MdApps size={20} />,
                text: "apps_manager",
                color: "cyan",
            },
        ],
        [],
    );

    const selectedMenuItem = useMemo(() => {
        return sbItem[section - 1];
    }, [section]);

    const handleMouseDown: MouseEventHandler<HTMLDivElement> = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setResizing(true);
        startXRef.current = e.clientX;
        if (toolsRef.current) {
            startWidthRef.current = toolsRef.current.clientWidth;
        }
    };

    useEffect(() => {
        if (!resizing) return;

        const handleMouseMove = (e: Event) => {
            const mouseEvent = e as unknown as MouseEvent;
            if (!toolsRef.current) return;
            const deltaX = mouseEvent.clientX - startXRef.current;
            const newWidth = Math.max(380, startWidthRef.current + deltaX);
            setToolWidth(newWidth);
        };

        const handleMouseUp = () => {
            setResizing(false);
            if (toolsRef.current) {
                localStorage.setItem(`tool_width_${deviceHash}`, toolsRef.current.clientWidth.toString());
            }
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [resizing]);

    useEffect(() => {
        localStorage.setItem("sbs_" + deviceHash, section.toString());
    }, [section, deviceHash]);

    useEffect(() => {
        localStorage.setItem("tfs_" + deviceHash, toolFullScreen.toString());
    }, [toolFullScreen, deviceHash]);

    useEffect(() => {
        localStorage.setItem("tfl_" + deviceHash, toolFloating.toString());
    }, [toolFloating, deviceHash]);

    return (
        <>
            <div className={clsx(cls.DeviceSidebar, sidebarLevel === 0 && cls.hide)}>
                <Card className={clsx(cls.Sidebar, sidebarLevel === 2 && cls.Expand)}>
                    <Flex gap="2" className={cls.SidebarContent} direction="column">
                        {sbItem.map((item, index) =>
                            sidebarLevel === 2 ? (
                                <Button
                                    key={index}
                                    className={cls.SidebarButton}
                                    variant="ghost"
                                    color={section !== index + 1 ? "gray" : item.color}
                                    onClick={() => {
                                        setSection(index + 1);
                                        if (item.onClick) {
                                            item.onClick();
                                        }
                                    }}
                                >
                                    <IconButton
                                        asChild
                                        variant="soft"
                                        color={section !== index + 1 ? "gray" : item.color}
                                    >
                                        <span>{item.icon}</span>
                                    </IconButton>
                                    <Text ml="1" className={cls.SbText}>
                                        {t(item.text)}
                                    </Text>
                                </Button>
                            ) : (
                                <IconButton
                                    key={index}
                                    variant="soft"
                                    color={section !== index + 1 ? "gray" : item.color}
                                    onClick={() => {
                                        setSection(index + 1);
                                        if (item.onClick) {
                                            item.onClick();
                                        }
                                    }}
                                >
                                    {item.icon}
                                </IconButton>
                            ),
                        )}
                        <DropdownMenu.Root>
                            <DropdownMenu.Trigger>
                                {sidebarLevel === 2 ? (
                                    <Button className={cls.SidebarButton} variant="ghost" color="gray">
                                        <IconButton asChild variant="soft" color="gray">
                                            <span>
                                                <PiPowerDuotone size={20} />
                                            </span>
                                        </IconButton>
                                        <Text ml="1" className={cls.SbText}>
                                            {t("power")}
                                        </Text>
                                    </Button>
                                ) : (
                                    <IconButton variant="soft" color="gray">
                                        <PiPowerDuotone size={20} />
                                    </IconButton>
                                )}
                            </DropdownMenu.Trigger>
                            <Power close={close} adb={adb} />
                        </DropdownMenu.Root>
                    </Flex>
                </Card>
            </div>
            {section > 0 && selectedMenuItem && (
                <div
                    className={clsx(
                        cls.DeviceTools,
                        toolFullScreen && clsx(cls.FullScreen, cls.Floating),
                        (toolFloating || mainDeviceSize.w < 600) && cls.Floating,
                        resizing && cls.Resizing,
                    )}
                    data-sb-lv={sidebarLevel}
                    ref={toolsRef}
                    style={toolWidth > 0 ? { width: `${toolWidth}px` } : undefined}
                >
                    <Card className={cls.DeviceToolsSection}>
                        <Flex align="center" gap="1" className={cls.DeviceToolsHeader}>
                            {selectedMenuItem.icon}
                            <Text size="3" weight="bold">
                                {t(selectedMenuItem.text)}
                            </Text>
                            <Box style={{ flex: 1 }} />
                            {mainDeviceSize.w > 600 && !toolFullScreen && (
                                <Tooltip content={t(toolFloating ? "exit_floating" : "enable_floating")}>
                                    <IconButton
                                        variant="soft"
                                        color="gray"
                                        size="1"
                                        onClick={() => setToolFloating(!toolFloating)}
                                    >
                                        {toolFloating ? <BiWindow size={18} /> : <BiWindows size={18} />}
                                    </IconButton>
                                </Tooltip>
                            )}
                            <Tooltip content={t(toolFullScreen ? "exit_full_screen" : "enter_full_screen")}>
                                <IconButton
                                    variant="soft"
                                    color="gray"
                                    size="1"
                                    onClick={() => setToolFullScreen(!toolFullScreen)}
                                >
                                    {toolFullScreen ? <MdFullscreenExit size={20} /> : <MdFullscreen size={20} />}
                                </IconButton>
                            </Tooltip>
                            <Tooltip content={t("close")}>
                                <IconButton
                                    variant="soft"
                                    color="gray"
                                    size="1"
                                    onClick={() => {
                                        setSection(0);
                                    }}
                                >
                                    <PiX size={20} />
                                </IconButton>
                            </Tooltip>
                        </Flex>
                        <div className={cls.DeviceToolsContent}>
                            {section === 2 && <Terminal adb={adb} onTerminalClose={() => setSection(0)} />}
                            {section === 3 && <FileManager adb={adb} deviceHash={deviceHash} config={config} />}
                            {section === 4 && <ToolsAppManager adb={adb} config={config} />}
                        </div>
                    </Card>
                    {!toolFullScreen && <div className={cls.ResizeHandle} onMouseDown={handleMouseDown} />}
                </div>
            )}
        </>
    );
}
