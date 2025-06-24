/*
 * Copyright (c) 2025 michioxd
 * Released under GNU General Public License 3.0. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import { AdbScrcpyOptions3_1 } from "@yume-chan/adb-scrcpy";
import {
    PackageManagerInstallLocation,
    PackageManagerInstallOptions,
    PackageManagerInstallReason,
} from "@yume-chan/android-bin";

export interface TConfig {
    scrcpy: {
        enable: boolean;
        config: AdbScrcpyOptions3_1.Init<boolean>;
    };
    install_apk: {
        useOptions: boolean;
        options: PackageManagerInstallOptions;
    };
}

class ConfigController {
    private deviceHash: string | "global" = "";
    private deviceType: "usb" | "websocket" = "usb";
    public static defaultConfig: TConfig = {
        scrcpy: {
            enable: true,
            config: {
                logLevel: "info",
                maxSize: 1280,
                maxFps: 60,
                sendFrameMeta: true,
                displayId: 0,
                control: true,
                video: true,
                videoBitRate: 5_000_000,
                videoSource: "display",
                audioCodec: "opus",
                audio: true,
                audioBitRate: 128_000,
                audioSource: "output",
            },
        },
        install_apk: {
            useOptions: false,
            options: {
                abi: "",
                allowTest: false,
                apex: false,
                bypassLowTargetSdkBlock: false,
                doNotKill: false,
                enableRollback: false,
                forceNonStaged: false,
                forceQueryable: false,
                forceUuid: "",
                full: false,
                grantRuntimePermissions: false,
                installLocation: PackageManagerInstallLocation.Auto,
                installReason: PackageManagerInstallReason.Unknown,
                originatingUri: "",
                refererUri: "",
                restrictPermissions: false,
                inheritFrom: "",
                installerPackageName: "",
                instantApp: false,
                internalStorage: false,
                packageName: "",
                preload: false,
                skipExisting: false,
                requestDowngrade: false,
                skipVerification: false,
                staged: false,
                stagedReadyTimeout: 0,
                user: "all",
            },
        },
    };

    constructor(deviceHash: typeof this.deviceHash, deviceType: typeof this.deviceType) {
        this.deviceHash = deviceHash;
        this.deviceType = deviceType;
    }

    private storage() {
        const key = `config:${this.deviceHash === "global" ? "global" : this.deviceType + ":" + this.deviceHash}`;
        const keyGlobal = `config:global`;
        return {
            get: () => {
                const config = localStorage.getItem(key);
                if (config) return JSON.parse(config) as TConfig;
                const configGlobal = localStorage.getItem(keyGlobal);
                if (configGlobal) return JSON.parse(configGlobal) as TConfig;
                return ConfigController.defaultConfig;
            },
            set: (value: string) => {
                localStorage.setItem(key, value);
            },
            clear: () => {
                localStorage.removeItem(key);
            },
        };
    }

    public getConfig() {
        const config = this.storage().get();
        return config;
    }

    public setConfig(config: TConfig) {
        this.storage().set(JSON.stringify(config));
    }

    public clearConfig() {
        this.storage().clear();
    }
}

export default ConfigController;
