/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import type { Adb } from "@yume-chan/adb";
import type { AdbDaemonWebUsbDevice } from "@yume-chan/adb-daemon-webusb";

export const connectedDevice = new Map<
    string,
    {
        dev: AdbDaemonWebUsbDevice;
        adb: Adb;
    }
>();

export const getConnectedDevice = (deviceHash: string) => {
    return connectedDevice.get(deviceHash);
};

export const setConnectedDevice = (deviceHash: string, dev: AdbDaemonWebUsbDevice, adb: Adb) => {
    connectedDevice.set(deviceHash, { dev, adb });
};

export const disconnectDevice = (deviceHash: string) => {
    const dev = connectedDevice.get(deviceHash);
    if (dev) {
        try {
            dev.adb.close();
            dev.dev.raw.close();
        } catch (error) {
            console.error("Error while disconnecting device", error);
        }
    }
    connectedDevice.delete(deviceHash);
};
