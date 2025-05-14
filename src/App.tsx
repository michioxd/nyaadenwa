/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import { useCallback, useEffect, useState } from "react";
import DeviceManager, { DeviceManagerTrackDevices } from "./controller/manager";
import type { AdbDaemonWebUsbDevice } from "@yume-chan/adb-daemon-webusb";
import Container from "./components/Container";
import cls from "./scss/Main.module.scss";
import clsx from "clsx";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { getDeviceHashFromDev } from "./utils/str";
import { observer } from "mobx-react";
import tabsController from "./controller/tabs";
import StackControls from "./components/Stack";
import { ContentTypeProperties } from "./types/content";

const App = observer(() => {
    const { t } = useTranslation();
    const [listDevices, setListDevices] = useState<AdbDaemonWebUsbDevice[]>([]);
    const [stackNum, setStackNum] = useState(0);

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
        if (tabsController.contents.size < 1) return;
        const deviceDisconnected: string[] = [];

        tabsController.contents.forEach((c) => {
            if (c.type !== ContentTypeProperties.Device) return;
            const device = listDevices.find((d) => getDeviceHashFromDev(d) === c.id);
            if (!device) {
                tabsController.closeTab(c.id);
                deviceDisconnected.push(c.title);
            }
        });

        if (deviceDisconnected.length > 0)
            toast.error(t("device_disconnected_description") + " " + deviceDisconnected.join(", "));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [listDevices, tabsController.contents]);

    useEffect(() => {
        const handleDeviceAdd = () => {
            toast.success(t("usb_device_connected"));
            handleGetDevice();
        }
        const handleDeviceRemove = () => {
            handleGetDevice();
        }

        window.navigator.usb.addEventListener("connect", handleDeviceAdd);
        window.navigator.usb.addEventListener("disconnect", handleDeviceRemove);

        handleGetDevice();

        return () => {
            window.navigator.usb.removeEventListener("connect", handleDeviceAdd);
            window.navigator.usb.removeEventListener("disconnect", handleDeviceRemove);
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
                        handleAddDevice={handleAddDevice}
                        handleGetDevice={handleGetDevice}
                        shouldShowWelcome={index === Math.floor(stackNum / 2)}
                        stackController={<StackControls stackNum={stackNum} setStackNum={setStackNum} index={index} />}
                    />
                </div>
            ))}
        </div>
    );
});

export default App;
