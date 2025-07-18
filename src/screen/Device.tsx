/*
 * Copyright (c) 2025 michioxd
 * Released under GNU General Public License 3.0. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import { AdbDaemonWebUsbDevice } from "@yume-chan/adb-daemon-webusb";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import cls from "./Device.module.scss";
import { Badge, Card, Flex, IconButton, Spinner, Text } from "@radix-ui/themes";
import useDialog from "@/components/dialog/Dialog";
import { useTranslation } from "react-i18next";
import { Adb } from "@yume-chan/adb";
import { DumpSys } from "@yume-chan/android-bin";
import DeviceHeader from "@/components/device/Header";
import DeviceManager from "@/controller/manager";
import { getDeviceHash } from "@/utils/str";
import ScrcpyPlayer from "@/components/scrcpy/Player";
import sessionDevices from "@/controller/devices";
import { observer } from "mobx-react";
import { RiSideBarFill, RiSidebarFoldLine, RiSidebarUnfoldLine } from "react-icons/ri";
import DeviceTools from "@/components/device/Tools";
import ConfigController from "@/controller/config";
import { RxExclamationTriangle } from "react-icons/rx";

enum DeviceState {
    Connecting = "CONNECTING",
    Disconnected = "DISCONNECTED",
    Connected = "CONNECTED",
}

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
        close,
        sidebarLevel,
        setSidebarLevel,
    }: {
        deviceName: string;
        state: DeviceState;
        t: (key: string) => string;
        dumpSys: DumpSys | null;
        close: () => void;
        sidebarLevel: number;
        setSidebarLevel: (sidebarLevel: number) => void;
    }) => {
        const [dvName, setDvName] = useState(deviceName);
        const badgeColor = useMemo(
            () => (state === DeviceState.Connected ? "green" : state === DeviceState.Disconnected ? "red" : "gray"),
            [state],
        );

        useEffect(() => {
            (async () => {
                const devName = await dumpSys?.adb?.getProp("ro.product.model");
                const devManufacturer = await dumpSys?.adb?.getProp("ro.product.manufacturer");
                if (devName && devManufacturer) {
                    setDvName(`${devManufacturer} ${devName}`);
                }
            })();
        }, [deviceName, dumpSys]);

        return (
            <Card className={cls.DeviceInfo}>
                <Flex gap="2" align="center" style={{ width: "100%" }}>
                    <IconButton
                        variant="ghost"
                        color={sidebarLevel === 2 ? "green" : sidebarLevel === 1 ? "cyan" : "gray"}
                        size="1"
                        onClick={() => setSidebarLevel(sidebarLevel === 2 ? 0 : sidebarLevel + 1)}
                    >
                        {sidebarLevel === 2 ? (
                            <RiSidebarFoldLine size={18} />
                        ) : sidebarLevel === 1 ? (
                            <RiSideBarFill size={18} />
                        ) : (
                            <RiSidebarUnfoldLine size={18} />
                        )}
                    </IconButton>
                    <Text size="1" style={{ width: "fit-content", flex: 1, textWrap: "nowrap", overflow: "auto" }}>
                        {dvName}
                    </Text>
                    <Badge size="1" color={badgeColor}>
                        {t(state)}
                    </Badge>
                    {dumpSys && <DeviceHeader dumpSys={dumpSys} close={close} />}
                </Flex>
            </Card>
        );
    },
);

DeviceInfo.displayName = "DeviceInfo";

const ScreenDevice = observer(
    ({
        usbDetails,
        webSocketURL,
        deviceHash,
        close,
    }: {
        usbDetails?: DeviceDetails;
        webSocketURL?: string;
        deviceHash: string;
        close: () => void;
    }) => {
        const [state, setState] = useState<DeviceState>(DeviceState.Connecting);
        const dialog = useDialog();
        const [sidebarLevel, setSidebarLevel] = useState(parseInt(localStorage.getItem("sbl_" + deviceHash) ?? "1"));
        const { t } = useTranslation();
        const [adb, setAdb] = useState<Adb | null>(null);
        const dumpSys = useMemo(() => (adb ? new DumpSys(adb) : null), [adb]);
        const mainDeviceRef = useRef<HTMLDivElement>(null);
        const [mainDeviceSize, setMainDeviceSize] = useState({
            w: 0,
            h: 0,
        });

        const deviceName = useMemo(
            () =>
                usbDetails
                    ? `${usbDetails?.name} (${usbDetails?.serial})`
                    : webSocketURL
                      ? `${webSocketURL} (WebSocket)`
                      : "Unknown",
            [usbDetails, webSocketURL],
        );

        const showErrorDialog = useCallback(
            (titleKey: string, descriptionKey: string) => {
                const deviceDescription = `${usbDetails?.manufacturerName} ${usbDetails?.name} (${usbDetails?.serial})`;
                dialog.alert(t(titleKey), t(descriptionKey, { device: deviceDescription }), close);
            },
            [dialog, t, close, usbDetails],
        );

        const config = useMemo(() => {
            return new ConfigController(deviceHash, usbDetails ? "usb" : "websocket").getConfig();
        }, [deviceHash, usbDetails]);

        const handleConnect = useCallback(async () => {
            setAdb(null);
            setState(DeviceState.Connecting);

            if (webSocketURL) {
                try {
                    const dev = await sessionDevices.addDeviceWebSocket(webSocketURL);
                    setAdb(dev.adb);
                    setState(DeviceState.Connected);
                } catch (error) {
                    showErrorDialog("cannot_connect_websocket", "cannot_connect_websocket_description");
                    console.error(error);
                    setState(DeviceState.Disconnected);
                }
                return;
            }

            if (!usbDetails) {
                return;
            }
            const devHash = getDeviceHash(usbDetails);

            if (devHash) {
                const dev = sessionDevices.getDevice(devHash);
                if (dev && dev.adb) {
                    setAdb(dev.adb);
                    setState(DeviceState.Connected);
                    return;
                }
            }

            try {
                const whichDev = await DeviceManager?.getDevices({
                    filters: [{ serialNumber: usbDetails.serial }],
                });

                if (!whichDev?.length) {
                    throw Error("Device not found");
                }

                const device = whichDev.find(
                    (dev) =>
                        dev.serial === usbDetails.serial &&
                        dev.raw.manufacturerName === usbDetails.manufacturerName &&
                        dev.name === usbDetails.name,
                );

                if (!device) {
                    throw Error("Device not found");
                }

                const dvc = await sessionDevices.addDeviceUSB(device);
                setAdb(dvc.adb);
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
        }, [webSocketURL, usbDetails, showErrorDialog]);

        useEffect(() => {
            handleConnect();
        }, []);

        useEffect(() => {
            if (!mainDeviceRef.current) return;

            setMainDeviceSize({ w: mainDeviceRef.current.clientWidth, h: mainDeviceRef.current.clientHeight });

            const handleResize = () => {
                if (mainDeviceRef.current) {
                    setMainDeviceSize({ w: mainDeviceRef.current.clientWidth, h: mainDeviceRef.current.clientHeight });
                }
            };

            const resizeObserver = new ResizeObserver(handleResize);
            resizeObserver.observe(mainDeviceRef.current);

            return () => {
                resizeObserver.disconnect();
            };
        }, [mainDeviceRef]);

        useEffect(() => {
            localStorage.setItem("sbl_" + deviceHash, sidebarLevel.toString());
        }, [sidebarLevel, deviceHash]);

        return (
            <div className={cls.Device} ref={mainDeviceRef}>
                <DeviceInfo
                    deviceName={deviceName}
                    state={state}
                    t={t}
                    dumpSys={dumpSys}
                    close={close}
                    sidebarLevel={sidebarLevel}
                    setSidebarLevel={setSidebarLevel}
                />
                <div className={cls.DeviceInner}>
                    {state === DeviceState.Connected && adb && (
                        <DeviceTools
                            deviceHash={deviceHash}
                            sidebarLevel={sidebarLevel}
                            adb={adb}
                            close={close}
                            mainDeviceSize={mainDeviceSize}
                            config={config}
                        />
                    )}
                    {state === DeviceState.Connecting ? (
                        <Card className={cls.Loading}>
                            <Spinner size="3" /> <Text size="1">{t("waiting_for_device")}</Text>
                        </Card>
                    ) : !config.scrcpy.enable ? (
                        <Card className={cls.Loading} style={{ zIndex: 0 }}>
                            <Text size="1" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <RxExclamationTriangle size={18} />
                                {t("scrcpy_disabled")}
                            </Text>
                        </Card>
                    ) : (
                        <>{adb && <ScrcpyPlayer dev={adb} config={config} />}</>
                    )}
                </div>
            </div>
        );
    },
);

export default memo(ScreenDevice);
