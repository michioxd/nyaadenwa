/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import { createRoot } from "react-dom/client";
import { Theme } from "@radix-ui/themes";
import DialogProvider from "./components/dialog/DialogProvider";
import { Toaster } from "sonner";
import App from "./App";
import "@/controller/manager";
import "@/locales/i18n";
import "@radix-ui/themes/styles.css";
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/700.css";
import "@/scss/tabs.scss";
import "@/main.scss";

createRoot(document.getElementById("root")!).render(
    <>
        <Toaster
            position="bottom-right"
            richColors
            duration={5000}
            theme="dark"
            className="toast"
            style={
                {
                    "--toast-bg": "var(--color-panel-solid)",
                    "--toast-border": "var(--gray-a5)",
                    "--toast-text": "var(--gray-12)",
                    "--toast-success-bg": "var(--green-3)",
                    "--toast-success-border": "var(--green-5)",
                    "--toast-success-text": "var(--green-11)",
                    "--toast-error-bg": "var(--red-3)",
                    "--toast-error-border": "var(--red-5)",
                    "--toast-error-text": "var(--red-11)",
                } as React.CSSProperties
            }
        />
        <Theme appearance="dark" accentColor="cyan">
            <DialogProvider>
                <App />
            </DialogProvider>
        </Theme>
    </>
);
