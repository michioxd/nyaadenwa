/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import type { AdbDaemonWebUsbDevice } from "@yume-chan/adb-daemon-webusb";
import objectHash from "object-hash";

export const getDeviceHashFromDev = (dev: AdbDaemonWebUsbDevice) => {
    return getDeviceHash({
        manufacturerName: dev.raw.manufacturerName ?? "",
        name: dev.name,
        serial: dev.serial,
    });
};

export const getDeviceHash = (device: { manufacturerName: string; name: string; serial: string }) => {
    return objectHash(
        {
            manufacturerName: device.manufacturerName,
            name: device.name,
            serial: device.serial,
        },
        { algorithm: "sha1" },
    );
};

export const getHashFromAddress = (address: string) => {
    return objectHash(
        { address },
        { algorithm: "sha1" },
    );
};
