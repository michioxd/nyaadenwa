import {
  AdbDaemonWebUsbDeviceManager,
  AdbDaemonWebUsbDeviceObserver,
} from "@yume-chan/adb-daemon-webusb";

const DeviceManager: AdbDaemonWebUsbDeviceManager | undefined =
  AdbDaemonWebUsbDeviceManager.BROWSER;

if (!DeviceManager) {
  const e = document.getElementById("notSupported");
  if (e) e.style.display = "flex";
  throw new Error("WebUSB is not supported in this browser");
}

const DeviceManagerTrackDevices: AdbDaemonWebUsbDeviceObserver =
  await DeviceManager.trackDevices();

export default DeviceManager;
DeviceManager.getDevices();
export { DeviceManagerTrackDevices };
