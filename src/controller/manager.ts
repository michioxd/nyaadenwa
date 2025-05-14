/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import { AdbDaemonWebUsbDeviceManager } from "@yume-chan/adb-daemon-webusb";

const DeviceManager: AdbDaemonWebUsbDeviceManager | undefined = AdbDaemonWebUsbDeviceManager.BROWSER;

export default DeviceManager;
