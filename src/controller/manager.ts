/*
 * Copyright (c) 2025 michioxd
 * Released under GNU General Public License 3.0. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import { AdbDaemonWebUsbDeviceManager } from "@yume-chan/adb-daemon-webusb";

const DeviceManager: AdbDaemonWebUsbDeviceManager | undefined = AdbDaemonWebUsbDeviceManager.BROWSER;

export default DeviceManager;
