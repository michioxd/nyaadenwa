import {
  AdbDaemonWebUsbDeviceManager,
  AdbDaemonWebUsbDeviceObserver,
} from "@yume-chan/adb-daemon-webusb";

const Manager: AdbDaemonWebUsbDeviceManager | undefined =
  AdbDaemonWebUsbDeviceManager.BROWSER;

if (!Manager) {
  const e = document.getElementById("notSupported");
  if (e) e.style.display = "flex";
  throw new Error("WebUSB is not supported in this browser");
}

const ManagerObserver: AdbDaemonWebUsbDeviceObserver =
  await Manager.trackDevices();

export default Manager;

export { ManagerObserver };
