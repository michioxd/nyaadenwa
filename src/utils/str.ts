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
    const url = new URL(address);

    return objectHash({ address: url.toString() }, { algorithm: "sha1" });
};

export function formatSize(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return "0 B";

    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    const formattedSize = (bytes / Math.pow(k, i)).toFixed(decimals);

    return `${formattedSize} ${sizes[i]}`;
}

export function formatPermissions(permission: number | string): string {
    if (typeof permission === "number") {
        permission = permission.toString();
    }

    if (permission.length !== 3 || !/^[0-7]{3}$/.test(permission)) {
        return "---";
    }

    const permissionMap = ["---", "--x", "-w-", "-wx", "r--", "r-x", "rw-", "rwx"];

    const owner = permissionMap[parseInt(permission[0], 10)];
    const group = permissionMap[parseInt(permission[1], 10)];
    const others = permissionMap[parseInt(permission[2], 10)];

    return `${owner}${group}${others}`;
}

export function isValidPath(path: string): boolean {
    return /^\/([^/\0"<>|:*?]+\/?)*$/.test(path) && path.length > 0 && path !== null && path.trim() !== "";
}

export function validateLinuxFileName(name: string): boolean {
    if (!name || name.length === 0 || name.length > 255) {
        return false;
    }

    if (name === "." || name === ".." || name === "") {
        return false;
    }

    return name !== null && name.trim() !== "" && /^[0-9a-zA-Z-._]+$/.test(name);
}
