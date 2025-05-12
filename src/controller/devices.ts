/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import { getDeviceHashFromDev } from "@/utils/str";
import { Adb, AdbDaemonTransport } from "@yume-chan/adb";
import AdbWebCredentialStore from "@yume-chan/adb-credential-web";
import type { AdbDaemonWebUsbDevice } from "@yume-chan/adb-daemon-webusb";
import { makeAutoObservable } from "mobx";

interface TConnectedDevice {
    dev: AdbDaemonWebUsbDevice;
    adb: Adb;
}

class SessionDevices {
    private readonly credentialStore = new AdbWebCredentialStore();
    private readonly connectedDevices: Map<string, TConnectedDevice> = new Map();

    constructor() {
        makeAutoObservable(this);
    }

    public getDevice(deviceHash: string) {
        return this.connectedDevices.get(deviceHash);
    }

    public async addDevice(device: AdbDaemonWebUsbDevice): Promise<TConnectedDevice> {
        const deviceHash = getDeviceHashFromDev(device);

        const dvc = await device.connect();

        const adb = new Adb(
            await AdbDaemonTransport.authenticate({
                serial: device.serial,
                connection: dvc,
                credentialStore: this.credentialStore,
            }),
        );

        this.connectedDevices.set(deviceHash, { dev: device, adb });

        return { dev: device, adb };
    }

    public removeDevice(deviceHash: string) {
        const device = this.connectedDevices.get(deviceHash);
        if (device) {
            device.adb.close();
            device.dev.raw.close();
        }
        this.connectedDevices.delete(deviceHash);
    }
}

const sessionDevices = new SessionDevices();

export default sessionDevices;
