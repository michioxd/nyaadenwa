import { createRoot } from "react-dom/client";
import App from "@/App.tsx";
import { Theme } from "@radix-ui/themes";
import "@/controller/manager";
import "@/locales/i18n";
import "@radix-ui/themes/styles.css";
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/700.css";
import "@/main.scss";

// will make it better later :)
const isWebUSBSupported = "usb" in navigator;

if (!isWebUSBSupported) {
  alert("WebUSB is not supported in this browser");
}

createRoot(document.getElementById("root")!).render(
  <Theme appearance="dark" accentColor="cyan">
    <App />
  </Theme>
);
