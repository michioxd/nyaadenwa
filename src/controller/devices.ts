/*
 * Copyright (c) 2025 michioxd
 * Released under GNU General Public License 3.0. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import { getDeviceHashFromDev, getHashFromAddress } from "@/utils/str";
import { Adb, AdbDaemonTransport } from "@yume-chan/adb";
import AdbWebCredentialStore from "@yume-chan/adb-credential-web";
import type { AdbDaemonWebUsbDevice } from "@yume-chan/adb-daemon-webusb";
import { makeAutoObservable, observable } from "mobx";
import AdbDaemonWebSocketDevice from "./websocket";
import { toast } from "sonner";
import tabsController from "./tabs";
import i18next from "i18next";

enum DeviceType {
    USB = "usb",
    WEBSOCKET = "websocket",
}

export type TConnectedDevice =
    | {
          type: DeviceType.USB;
          dev: AdbDaemonWebUsbDevice;
          adb: Adb;
      }
    | {
          type: DeviceType.WEBSOCKET;
          daemon: AdbDaemonWebSocketDevice;
          adb: Adb;
      };

class SessionDevices {
    private readonly credentialStore = new AdbWebCredentialStore("nyaadenwa");
    private readonly connectedDevices = observable.map<string, TConnectedDevice>();

    constructor() {
        makeAutoObservable(this);
    }

    public getDevice(deviceHash: string) {
        return this.connectedDevices.get(deviceHash);
    }

    public async addDeviceUSB(device: AdbDaemonWebUsbDevice): Promise<TConnectedDevice> {
        const deviceHash = getDeviceHashFromDev(device);

        const dvc = await device.connect();

        const adb = new Adb(
            await AdbDaemonTransport.authenticate({
                serial: device.serial,
                connection: dvc,
                credentialStore: this.credentialStore,
            }),
        );

        this.connectedDevices.set(deviceHash, {
            dev: device,
            adb,
            type: DeviceType.USB,
        });

        return { dev: device, adb, type: DeviceType.USB };
    }

    public async addDeviceWebSocket(address: string): Promise<TConnectedDevice> {
        new URL(address); // throw error if invalid
        const deviceHash = getHashFromAddress(address);
        let connected = false;

        const wsDaemon = new AdbDaemonWebSocketDevice(address, deviceHash);

        const timeout = setTimeout(() => {
            wsDaemon.close();
            throw new Error("Timeout waiting for device to connect");
        }, 30000);

        wsDaemon.onClose = (e) => {
            clearTimeout(timeout);
            console.error("WebSocket device disconnected", e);
            if (connected) {
                tabsController.closeTab(deviceHash);
                this.removeDevice(deviceHash, true);
            }
        };

        wsDaemon.onError = (e) => {
            clearTimeout(timeout);
            console.error("WebSocket device connection error", e);
            if (connected) {
                tabsController.closeTab(deviceHash);
                this.removeDevice(deviceHash, true);
            }
        };

        const dvc = await wsDaemon.connect();
        const adb = new Adb(
            await AdbDaemonTransport.authenticate({
                serial: "",
                connection: dvc,
                credentialStore: this.credentialStore,
            }),
        );

        this.connectedDevices.set(deviceHash, {
            daemon: wsDaemon,
            adb,
            type: DeviceType.WEBSOCKET,
        });
        connected = true;

        clearTimeout(timeout);

        return { daemon: wsDaemon, adb, type: DeviceType.WEBSOCKET };
    }

    public removeDevice(deviceHash: string, uncaughtRemove?: boolean) {
        const device = this.connectedDevices.get(deviceHash);
        if (uncaughtRemove) {
            toast.error(i18next.t("websocket_device_disconnected"));
        }
        if (device) {
            try {
                device.adb.close();
                if (device.type === DeviceType.USB) {
                    device.dev.raw.close();
                } else {
                    device.daemon.close();
                }
            } catch (error) {
                console.error(error);
            }
        }
        this.connectedDevices.delete(deviceHash);
        console.log("Device removed", deviceHash);
    }
}

const sessionDevices = new SessionDevices();

export default sessionDevices;
