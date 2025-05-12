/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import {
    EnterIcon,
    ExclamationTriangleIcon,
    GearIcon,
    HamburgerMenuIcon,
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
import ScreenWelcome from "@/screen/Welcome";
import { ContentTypeProperties } from "@/types/content";
import cls from "@/scss/Main.module.scss";
import About from "./About";
import LangSelector from "./LangSelector";
import ScreenDevice from "@/screen/Device";
import useDialog from "./dialog/Dialog";
import { getDeviceHashFromDev } from "@/utils/str";
import tabsController from "@/controller/tabs";
import { observer } from "mobx-react";
import { computed } from "mobx";

const deviceForgot: string[] = [];

const Container = observer(
    ({
        listDevices,
        stackNo,
        handleAddDevice,
        handleGetDevice,
        stackController,
        shouldShowWelcome,
    }: {
        listDevices: AdbDaemonWebUsbDevice[];
        stackNo: number;
        handleAddDevice: () => void;
        handleGetDevice: () => void;
        stackController: React.ReactNode;
        shouldShowWelcome: boolean;
    }) => {
        const { t } = useTranslation();
        const dialog = useDialog();

        const filteredTabs = computed(() => tabsController.tabs.filter((tab) => tab.stackNo === stackNo)).get();

        console.log(tabsController);
        return (
            <>
                <Tabs
                    draggable
                    onTabClose={(id) => tabsController.closeTab(id)}
                    onTabReorder={(id, from, toIndex) => tabsController.tabReorder(id, from, toIndex, stackNo)}
                    onTabActive={(id) => tabsController.makeTabActive(id, stackNo)}
                    tabs={filteredTabs}
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
                                            color="cyan"
                                            variant="soft"
                                        >
                                            <HamburgerMenuIcon />
                                        </IconButton>
                                    </DropdownMenu.Trigger>
                                    <DropdownMenu.Content size="1" variant="soft">
                                        <DropdownMenu.Item onClick={handleAddDevice}>
                                            <PlusIcon />
                                            {t("add_device")}
                                        </DropdownMenu.Item>
                                        <DropdownMenu.Item
                                            onClick={() =>
                                                tabsController.openTab(
                                                    {
                                                        id: "settings",
                                                        title: t("settings"),
                                                        type: ContentTypeProperties.Settings,
                                                        content: () => <div>Settings</div>,
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
                                                dialog.alert(t("about_nyaadenwa"), <About />);
                                            }}
                                        >
                                            <InfoCircledIcon />
                                            {t("about_nyaadenwa")}
                                        </DropdownMenu.Item>
                                        <DropdownMenu.Separator />
                                        {listDevices.length < 1 ? (
                                            <DropdownMenu.Item disabled>{t("no_device_connected")}</DropdownMenu.Item>
                                        ) : (
                                            listDevices.map((device) => {
                                                const isForgot = deviceForgot.includes(
                                                    device.raw.manufacturerName + device.name + device.serial,
                                                );
                                                return (
                                                    <DropdownMenu.Sub key={device.name + device.serial}>
                                                        <DropdownMenu.SubTrigger>
                                                            {isForgot ? <ExclamationTriangleIcon /> : <MobileIcon />}
                                                            {device.name}
                                                            <Text
                                                                size="1"
                                                                color="gray"
                                                                style={{
                                                                    fontSize: "10px",
                                                                }}
                                                            >
                                                                {device.serial}
                                                            </Text>
                                                        </DropdownMenu.SubTrigger>
                                                        <DropdownMenu.SubContent>
                                                            {isForgot && (
                                                                <DropdownMenu.Item
                                                                    onClick={() => window.location.reload()}
                                                                >
                                                                    <ReloadIcon />
                                                                    {t("device_forgot")}
                                                                </DropdownMenu.Item>
                                                            )}
                                                            <DropdownMenu.Item
                                                                disabled={isForgot}
                                                                onClick={() => {
                                                                    if (isForgot) return;
                                                                    tabsController.openTab(
                                                                        {
                                                                            id: getDeviceHashFromDev(device),
                                                                            title:
                                                                                device.name +
                                                                                " (" +
                                                                                device.serial +
                                                                                ")",
                                                                            type: ContentTypeProperties.Device,
                                                                            content: ({ close }) => (
                                                                                <ScreenDevice
                                                                                    devDetails={{
                                                                                        manufacturerName:
                                                                                            device.raw
                                                                                                .manufacturerName ?? "",
                                                                                        name: device.name,
                                                                                        serial: device.serial,
                                                                                    }}
                                                                                    close={close}
                                                                                />
                                                                            ),
                                                                            stackNo: stackNo,
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
                                                                        t("forget_device"),
                                                                        <>
                                                                            {t("forget_device_description", {
                                                                                device:
                                                                                    device.raw.manufacturerName +
                                                                                    " " +
                                                                                    device.name +
                                                                                    " (" +
                                                                                    device.serial +
                                                                                    ")",
                                                                            })}
                                                                        </>,
                                                                        () => {
                                                                            deviceForgot.push(
                                                                                device.raw.manufacturerName +
                                                                                device.name +
                                                                                device.serial,
                                                                            );
                                                                            try {
                                                                                device.raw.close();
                                                                                device.raw.forget();
                                                                            } catch (error) {
                                                                                console.error(error);
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
                    {filteredTabs.length < 1 ? (
                        <ScreenWelcome shouldShowWelcome={shouldShowWelcome} />
                    ) : (
                        Array.from(tabsController.contents.values()).filter((c) => c.stackNo === stackNo).map((c) => (
                            <div
                                key={c.uuid}
                                className={clsx(
                                    cls.content,
                                    tabsController.tabs.find(
                                        (tab) => tab.id === c.id && tab.stackNo === stackNo && tab.active,
                                    ) && cls.active,
                                )}
                            >
                                <c.content close={() => tabsController.closeTab(c.id)} />
                            </div>
                        ))
                    )}
                </div>
            </>
        );
    },
);

export default Container;
