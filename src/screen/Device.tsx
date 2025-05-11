/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import { AdbDaemonWebUsbDevice } from "@yume-chan/adb-daemon-webusb";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import cls from "./Device.module.scss";
import { Badge, Card, Flex, Spinner, Text } from "@radix-ui/themes";
import useDialog from "@/components/dialog/Dialog";
import { useTranslation } from "react-i18next";
import { Adb, AdbDaemonTransport } from "@yume-chan/adb";
import AdbWebCredentialStore from "@yume-chan/adb-credential-web";
import { DumpSys } from "@yume-chan/android-bin";
import DeviceHeader from "@/components/device/Header";
import DeviceManager from "@/controller/manager";
import { getDeviceHash } from "@/utils/str";
import { getConnectedDevice, setConnectedDevice } from "@/components/device/connected";
import ScrcpyPlayer from "@/components/scrcpy/Player";

enum DeviceState {
    Connecting = "CONNECTING",
    Disconnected = "DISCONNECTED",
    Connected = "CONNECTED",
}

const CredentialStore = new AdbWebCredentialStore();

interface DeviceDetails {
    manufacturerName: string;
    name: string;
    serial: string;
}

const DeviceInfo = memo(
    ({
        deviceName,
        state,
        t,
        dumpSys,
    }: {
        deviceName: string;
        state: DeviceState;
        t: (key: string) => string;
        dumpSys: DumpSys | null;
    }) => {
        const badgeColor = useMemo(
            () => (state === DeviceState.Connected ? "green" : state === DeviceState.Disconnected ? "red" : "gray"),
            [state],
        );

        return (
            <Card className={cls.DeviceInfo}>
                <Flex gap="2" align="center" style={{ width: "100%" }}>
                    <Text size="2" style={{ width: "fit-content", flex: 1 }}>
                        {deviceName}
                    </Text>
                    <Badge size="1" color={badgeColor}>
                        {t(state)}
                    </Badge>
                    {dumpSys && <DeviceHeader dumpSys={dumpSys} />}
                </Flex>
            </Card>
        );
    },
);

DeviceInfo.displayName = "DeviceInfo";

function ScreenDevice({ devDetails, close }: { devDetails: DeviceDetails; close: () => void }) {
    const [state, setState] = useState<DeviceState>(DeviceState.Connecting);
    const dialog = useDialog();
    const { t } = useTranslation();
    const [adb, setAdb] = useState<Adb | null>(null);
    const dumpSys = useMemo(() => (adb ? new DumpSys(adb) : null), [adb]);

    const deviceName = useMemo(() => `${devDetails.name}`, [devDetails.name]);

    const showErrorDialog = useCallback(
        (titleKey: string, descriptionKey: string) => {
            const deviceDescription = `${devDetails.manufacturerName} ${devDetails.name} (${devDetails.serial})`;
            dialog.alert(t(titleKey), t(descriptionKey, { device: deviceDescription }), close);
        },
        [dialog, t, close, devDetails],
    );

    const handleConnect = useCallback(async () => {
        const devHash = getDeviceHash(devDetails);
        setAdb(null);
        setState(DeviceState.Connecting);

        if (devHash) {
            const dev = getConnectedDevice(devHash);
            if (dev && dev.adb) {
                setAdb(dev.adb);
                setState(DeviceState.Connected);
                return;
            }
        }
        try {
            const whichDev = await DeviceManager?.getDevices({
                filters: [{ serialNumber: devDetails.serial }],
            });

            if (!whichDev?.length) {
                throw Error("Device not found");
            }

            const device = whichDev.find(
                (dev) =>
                    dev.serial === devDetails.serial &&
                    dev.raw.manufacturerName === devDetails.manufacturerName &&
                    dev.name === devDetails.name,
            );

            if (!device) {
                throw Error("Device not found");
            }

            const dvc = await device.connect();
            const transport = await AdbDaemonTransport.authenticate({
                serial: device.serial,
                connection: dvc,
                credentialStore: CredentialStore,
            });
            const createdAdb = new Adb(transport);
            setAdb(createdAdb);
            setConnectedDevice(devHash, device, createdAdb);
            setState(DeviceState.Connected);
            return device;
        } catch (error) {
            if (String(error).includes("Access denied")) {
                showErrorDialog("device_access_denied", "device_access_denied_description");
            } else if (error instanceof AdbDaemonWebUsbDevice.DeviceBusyError) {
                showErrorDialog("device_busy", "device_busy_description");
            } else {
                showErrorDialog("cannot_connect_device", "cannot_connect_device_description");
            }

            console.error(error);
            setState(DeviceState.Disconnected);
            return null;
        }
    }, [devDetails, showErrorDialog]);

    useEffect(() => {
        handleConnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className={cls.Device}>
            <DeviceInfo deviceName={deviceName} state={state} t={t} dumpSys={dumpSys} />
            {state === DeviceState.Connecting ? (
                <Card className={cls.Loading}>
                    <Spinner size="3" /> <Text size="1">{t("waiting_for_device")}</Text>
                </Card>
            ) : (
                <>{state === DeviceState.Connected && adb && <ScrcpyPlayer dev={adb} />}</>
            )}
        </div>
    );
}

export default memo(ScreenDevice);
