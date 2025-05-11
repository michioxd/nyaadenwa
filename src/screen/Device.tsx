/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import {
    AdbDaemonWebUsbDevice,
    type AdbDaemonWebUsbConnection,
} from "@yume-chan/adb-daemon-webusb";
import { memo, useEffect, useState } from "react";
import cls from "./Device.module.scss";
import { Badge, Card, Text } from "@radix-ui/themes";
import useDialog from "@/components/dialog/Dialog";
import { useTranslation } from "react-i18next";
import { Adb, AdbDaemonTransport } from "@yume-chan/adb";

enum DeviceState {
    Connecting = "CONNECTING",
    Disconnected = "DISCONNECTED",
    Connected = "CONNECTED",
}

function ScreenDevice({
    device,
    close,
}: {
    device: AdbDaemonWebUsbDevice;
    close: () => void;
}) {
    const [state, setState] = useState<DeviceState>(DeviceState.Connecting);
    const dialog = useDialog();
    const { t } = useTranslation();
    const [adb, setAdb] = useState<Adb | null>(null);

    const handleConnect = async () => {
        setAdb(null);
        setState(DeviceState.Connecting);
        try {
            const dvc = await device.connect();
            const transport = new AdbDaemonTransport({
                serial: dvc.device.serial,
                connection: dvc,
                version: 3,
                maxPayloadSize: 4096,
                banner: "nyaadenwa",
                initialDelayedAckBytes: 1,
            });
            const createdAdb = new Adb(transport);
            console.log(createdAdb);
            setAdb(createdAdb);
            setState(DeviceState.Connected);
        } catch (error) {
            const deviceDescription = `${device.raw.manufacturerName} ${device.name} (${device.serial})`;

            const showErrorDialog = (
                titleKey: string,
                descriptionKey: string,
            ) => {
                dialog.alert(
                    t(titleKey),
                    t(descriptionKey, { device: deviceDescription }),
                    close,
                );
            };

            if (String(error).includes("Access denied")) {
                showErrorDialog(
                    "device_access_denied",
                    "device_access_denied_description",
                );
            } else if (error instanceof AdbDaemonWebUsbDevice.DeviceBusyError) {
                showErrorDialog("device_busy", "device_busy_description");
            } else {
                showErrorDialog(
                    "cannot_connect_device",
                    "cannot_connect_device_description",
                );
            }

            console.error(error);
            setState(DeviceState.Disconnected);
        }
    };

    useEffect(() => {
        handleConnect();

        return () => {
            if (adb) {
                adb.close();
            }
            setAdb(null);
            device.raw.close();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return (
        <div className={cls.Device}>
            <Card className={cls.DeviceInfo}>
                <Text size="2">
                    {device.raw.manufacturerName + " " + device.name}{" "}
                    <Badge
                        size="1"
                        color={
                            state === DeviceState.Connected
                                ? "green"
                                : state === DeviceState.Disconnected
                                  ? "red"
                                  : "gray"
                        }
                    >
                        {t(state)}
                    </Badge>
                </Text>
            </Card>
        </div>
    );
}

export default memo(ScreenDevice);
