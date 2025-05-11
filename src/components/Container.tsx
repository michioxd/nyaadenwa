/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import {
    EnterIcon,
    ExclamationTriangleIcon,
    GearIcon,
    InfoCircledIcon,
    MixIcon,
    MobileIcon,
    PlusIcon,
    ReloadIcon,
    TrashIcon,
} from "@radix-ui/react-icons";
import { Box, DropdownMenu, IconButton, Text } from "@radix-ui/themes";
import { Tabs } from "@sinm/react-chrome-tabs";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import type { AdbDaemonWebUsbDevice } from "@yume-chan/adb-daemon-webusb";
import type { TabProperties } from "@sinm/react-chrome-tabs/dist/chrome-tabs";
import ScreenWelcome from "@/screen/Welcome";
import { ContentTypeProperties, type ContentType } from "@/types/content";
import cls from "@/scss/Main.module.scss";
import About from "./About";
import LangSelector from "./LangSelector";
import ScreenDevice from "@/screen/Device";
import useDialog from "./dialog/Dialog";

const deviceForgot: string[] = [];

export default function Container({
    listDevices,
    stackNo,
    tabs,
    content,
    handleAddDevice,
    handleGetDevice,
    handleOpenNewTab,
    close,
    reorder,
    active,
    stackController,
    shouldShowWelcome,
}: {
    listDevices: AdbDaemonWebUsbDevice[];
    stackNo: number;
    tabs: TabProperties[];
    content: ContentType[];
    handleAddDevice: () => void;
    handleGetDevice: () => void;
    handleOpenNewTab: (content: ContentType, stackNo: number) => void;
    close: (id: string) => void;
    reorder: (id: string, _: number, toIndex: number, stackNo: number) => void;
    active: (id: string, stackNo: number) => void;
    stackController: React.ReactNode;
    shouldShowWelcome: boolean;
}) {
    const { t } = useTranslation();
    const dialog = useDialog();

    return (
        <>
            <Tabs
                draggable
                onTabClose={(id) => close(id)}
                onTabReorder={(id, from, toIndex) =>
                    reorder(id, from, toIndex, stackNo)
                }
                onTabActive={(id) => active(id, stackNo)}
                tabs={tabs.filter((tab) => tab.stackNo === stackNo)}
                i18nIsDynamicList
                pinnedRight={
                    <>
                        <Box
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.2rem",
                            }}
                        >
                            <DropdownMenu.Root>
                                <DropdownMenu.Trigger>
                                    <IconButton
                                        style={{ margin: "6px 0 0 6px" }}
                                        size="1"
                                        color="gray"
                                        variant="soft"
                                    >
                                        <PlusIcon />
                                    </IconButton>
                                </DropdownMenu.Trigger>
                                <DropdownMenu.Content size="1" variant="soft">
                                    <DropdownMenu.Item
                                        shortcut="Ctrl+Alt+N"
                                        onClick={handleAddDevice}
                                    >
                                        <PlusIcon />
                                        {t("add_device")}
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Item
                                        onClick={() =>
                                            handleOpenNewTab(
                                                {
                                                    id: "settings",
                                                    title: t("settings"),
                                                    type: ContentTypeProperties.Settings,
                                                    content: () => (
                                                        <div>Settings</div>
                                                    ),
                                                    stackNo: stackNo,
                                                },
                                                stackNo,
                                            )
                                        }
                                    >
                                        <GearIcon />
                                        {t("settings")}
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Sub>
                                        <DropdownMenu.SubTrigger>
                                            <MixIcon />
                                            {t("change_language")}
                                        </DropdownMenu.SubTrigger>
                                        <LangSelector />
                                    </DropdownMenu.Sub>
                                    <DropdownMenu.Item
                                        onClick={() => {
                                            dialog.alert(
                                                t("about_nyaadenwa"),
                                                <About />,
                                            );
                                        }}
                                    >
                                        <InfoCircledIcon />
                                        {t("about_nyaadenwa")}
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Separator />
                                    {listDevices.length < 1 ? (
                                        <DropdownMenu.Item disabled>
                                            {t("no_device_connected")}
                                        </DropdownMenu.Item>
                                    ) : (
                                        listDevices.map((device) => {
                                            const isForgot =
                                                deviceForgot.includes(
                                                    device.raw
                                                        .manufacturerName +
                                                        device.name +
                                                        device.serial,
                                                );
                                            return (
                                                <DropdownMenu.Sub
                                                    key={
                                                        device.name +
                                                        device.serial
                                                    }
                                                >
                                                    <DropdownMenu.SubTrigger>
                                                        {isForgot ? (
                                                            <ExclamationTriangleIcon />
                                                        ) : (
                                                            <MobileIcon />
                                                        )}
                                                        {device.name}
                                                        <Text
                                                            size="1"
                                                            color="gray"
                                                            style={{
                                                                fontSize:
                                                                    "10px",
                                                            }}
                                                        >
                                                            {device.serial}
                                                        </Text>
                                                    </DropdownMenu.SubTrigger>
                                                    <DropdownMenu.SubContent>
                                                        {isForgot && (
                                                            <DropdownMenu.Item
                                                                onClick={() =>
                                                                    window.location.reload()
                                                                }
                                                            >
                                                                <ReloadIcon />
                                                                {t(
                                                                    "device_forgot",
                                                                )}
                                                            </DropdownMenu.Item>
                                                        )}
                                                        <DropdownMenu.Item
                                                            disabled={isForgot}
                                                            onClick={() => {
                                                                if (isForgot)
                                                                    return;
                                                                handleOpenNewTab(
                                                                    {
                                                                        id:
                                                                            device
                                                                                .raw
                                                                                .manufacturerName +
                                                                            device.name +
                                                                            device.serial,
                                                                        title:
                                                                            device.name +
                                                                            " (" +
                                                                            device.serial +
                                                                            ")",
                                                                        type: ContentTypeProperties.Device,
                                                                        content:
                                                                            ({
                                                                                close,
                                                                            }) => (
                                                                                <ScreenDevice
                                                                                    device={
                                                                                        device
                                                                                    }
                                                                                    close={
                                                                                        close
                                                                                    }
                                                                                />
                                                                            ),
                                                                        stackNo:
                                                                            stackNo,
                                                                    },
                                                                    stackNo,
                                                                );
                                                            }}
                                                        >
                                                            <EnterIcon />
                                                            {t("open")}
                                                        </DropdownMenu.Item>
                                                        <DropdownMenu.Item
                                                            onClick={() => {
                                                                dialog.confirm(
                                                                    t(
                                                                        "forget_device",
                                                                    ),
                                                                    <>
                                                                        {t(
                                                                            "forget_device_description",
                                                                            {
                                                                                device:
                                                                                    device
                                                                                        .raw
                                                                                        .manufacturerName +
                                                                                    " " +
                                                                                    device.name +
                                                                                    " (" +
                                                                                    device.serial +
                                                                                    ")",
                                                                            },
                                                                        )}
                                                                    </>,
                                                                    () => {
                                                                        deviceForgot.push(
                                                                            device
                                                                                .raw
                                                                                .manufacturerName +
                                                                                device.name +
                                                                                device.serial,
                                                                        );
                                                                        try {
                                                                            device.raw.close();
                                                                            device.raw.forget();
                                                                        } catch (error) {
                                                                            console.error(
                                                                                error,
                                                                            );
                                                                        } finally {
                                                                            handleGetDevice();
                                                                        }
                                                                    },
                                                                );
                                                            }}
                                                        >
                                                            <TrashIcon />
                                                            {t("forget_device")}
                                                        </DropdownMenu.Item>
                                                    </DropdownMenu.SubContent>
                                                </DropdownMenu.Sub>
                                            );
                                        })
                                    )}
                                </DropdownMenu.Content>
                            </DropdownMenu.Root>
                            {stackController}
                        </Box>
                    </>
                }
            />
            <div className={cls.Main}>
                {tabs.filter((tab) => tab.stackNo === stackNo).length > 0 ? (
                    content.map((c) => (
                        <div
                            key={c.uuid}
                            className={clsx(
                                cls.content,
                                tabs.find(
                                    (tab) =>
                                        tab.id === c.id &&
                                        tab.stackNo === stackNo &&
                                        tab.active,
                                ) && cls.active,
                            )}
                        >
                            <c.content close={() => close(c.id)} />
                        </div>
                    ))
                ) : (
                    <div className={clsx(cls.content, cls.active)}>
                        <ScreenWelcome shouldShowWelcome={shouldShowWelcome} />
                    </div>
                )}
            </div>
        </>
    );
}
