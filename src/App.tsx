/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import DeviceManager, { DeviceManagerTrackDevices } from "./controller/manager";
import type { AdbDaemonWebUsbDevice } from "@yume-chan/adb-daemon-webusb";
import type { TabProperties } from "@sinm/react-chrome-tabs/dist/chrome-tabs";
import { ContentTypeProperties, type ContentType } from "./types/content";
import Container from "./components/Container";
import cls from "./scss/Main.module.scss";
import { IconButton, Text } from "@radix-ui/themes";
import { DividerHorizontalIcon, PlusIcon } from "@radix-ui/react-icons";
import clsx from "clsx";
import { toast } from "sonner";
import useDialog from "./components/dialog/Dialog";
import { useTranslation } from "react-i18next";
import { disconnectDevice } from "./components/device/connected";
import { getDeviceHash } from "./utils/str";

function App() {
    const dialog = useDialog();
    const { t } = useTranslation();
    const [listDevices, setListDevices] = useState<AdbDaemonWebUsbDevice[]>([]);
    const [content, setContent] = useState<ContentType[]>([]);
    const [tabs, setTabs] = useState<TabProperties[]>([]);
    const [stackNum, setStackNum] = useState(0);
    const [currentWindowWidth, setCurrentWindowWidth] = useState(window.innerWidth);

    const handleOpenNewTab = useCallback(
        (content: ContentType, stackNo: number) => {
            const existing = tabs.find((tab) => tab.id === content.id);

            if (existing) {
                setTabs(
                    tabs.map((tab) =>
                        tab.stackNo !== existing.stackNo
                            ? tab
                            : {
                                  ...tab,
                                  active: tab.id === existing.id,
                              },
                    ),
                );
                return;
            }

            const uuid = uuidv4();

            setContent((p) => [
                ...p,
                {
                    uuid: uuid,
                    ...content,
                },
            ]);
            setTabs((p) => [
                ...p.map((tab) => (tab.stackNo === stackNo ? { ...tab, active: false } : tab)),
                {
                    id: content.id,
                    title: content.title,
                    active: true,
                    stackNo: stackNo,
                },
            ]);
        },
        [tabs],
    );

    const tabActive = (id: string, stackNo: number) => {
        setTabs(
            tabs.map((tab) =>
                stackNo === tab.stackNo
                    ? {
                          ...tab,
                          active: id === tab.id,
                      }
                    : tab,
            ),
        );
    };

    const tabClose = (id: string) => {
        const filteredTabs = tabs.filter((tab) => tab.id !== id);
        const newIndex = Math.min(
            tabs.findIndex((tab) => tab.id === id),
            filteredTabs.length - 1,
        );

        if (id.length === 40) {
            disconnectDevice(id);
        }

        setContent(content.filter((c) => c.id !== id));
        setTabs(filteredTabs.map((tab, i) => ({ ...tab, active: i === newIndex })));
    };

    const tabReorder = (tabId: string, _: number, toIndex: number, stackNo: number) => {
        const beforeTab = tabs.find((tab) => tab.id === tabId && tab.stackNo === stackNo);
        if (!beforeTab) {
            return;
        }
        const newTabs = tabs.filter((tab) => tab.id !== tabId && tab.stackNo === stackNo);
        newTabs.splice(toIndex, 0, beforeTab);
        setTabs(newTabs);
    };

    const handleGetDevice = useCallback(async () => {
        try {
            const dv = await DeviceManager?.getDevices();
            setListDevices(dv ?? []);
        } catch (error) {
            toast.error("Failed to get devices, please check console for more details");
            console.error(error);
        }
    }, []);

    const handleAddDevice = useCallback(async () => {
        try {
            await DeviceManager?.requestDevice();
        } catch (error) {
            toast.error("Failed to add device, please check console for more details");
            console.error(error);
        } finally {
            handleGetDevice();
        }
    }, [handleGetDevice]);

    useEffect(() => {
        if (content.length < 1) return;
        const deviceDisconnected: string[] = [];

        content
            .filter((c) => c.type === ContentTypeProperties.Device)
            .map((c) => {
                const device = listDevices.find(
                    (d) =>
                        getDeviceHash({
                            manufacturerName: d.raw.manufacturerName ?? "",
                            name: d.name,
                            serial: d.serial,
                        }) === c.id,
                );
                if (!device) {
                    tabClose(c.id);
                    deviceDisconnected.push(c.title);
                }
            });

        if (deviceDisconnected.length > 0)
            toast.error(t("device_disconnected_description") + " " + deviceDisconnected.join(", "));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [content, listDevices]);

    useEffect(() => {
        DeviceManagerTrackDevices.onDeviceAdd(() => {
            toast.success(t("device_attached"));
            handleGetDevice();
        });
        DeviceManagerTrackDevices.onDeviceRemove(handleGetDevice);

        handleGetDevice();
        const handleResize = () => {
            setCurrentWindowWidth(window.innerWidth);
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            DeviceManagerTrackDevices.stop();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className={clsx(cls.Stack, stackNum > 0 && cls.enabledStack)}>
            {Array.from({ length: stackNum + 1 }).map((_, index) => (
                <div className={cls.StackContainer} key={index}>
                    <Container
                        listDevices={listDevices}
                        stackNo={index}
                        tabs={tabs}
                        content={content}
                        handleAddDevice={handleAddDevice}
                        handleGetDevice={handleGetDevice}
                        handleOpenNewTab={handleOpenNewTab}
                        close={tabClose}
                        reorder={tabReorder}
                        active={tabActive}
                        shouldShowWelcome={
                            (content.length === 0 && index === Math.floor(stackNum / 2)) ||
                            (index > 0 &&
                                content.find((c) => c.stackNo === index) === undefined &&
                                content.find((c) => c.stackNo === index - 1) !== undefined)
                        }
                        stackController={
                            currentWindowWidth > 700 && (
                                <div className={cls.StackController}>
                                    <IconButton
                                        variant="soft"
                                        size="1"
                                        onClick={() => setStackNum(stackNum - 1)}
                                        disabled={stackNum === 0}
                                    >
                                        <DividerHorizontalIcon />
                                    </IconButton>
                                    <Text>{index + 1}</Text>
                                    <IconButton
                                        variant="soft"
                                        size="1"
                                        disabled={currentWindowWidth / (stackNum + 1) <= 700}
                                        onClick={() => setStackNum(stackNum + 1)}
                                    >
                                        <PlusIcon />
                                    </IconButton>
                                </div>
                            )
                        }
                    />
                </div>
            ))}
        </div>
    );
}

export default App;
