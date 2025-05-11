/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import type { LocaleResourcesType } from "@/locales/list";

/**
 * @description English translation
 * @author michioxd
 */
const Locale: LocaleResourcesType = {
    translation: {
        add_device: "Add device",
        settings: "Settings",
        change_language: "Change language",
        about_nyaadenwa: "About nyaadenwa",
        no_device_connected: "No device connected",
        forget: "Forget",
        forget_device: "Forget device",
        device_forgot: "Device forgotten. Please refresh the page to reconnect.",
        forget_device_description:
            "Are you sure you want to forget this device? ({{device}}) After forgetting, if you want to connect again, you need to refresh this page.",
        open: "Open",
        welcome_title: "welcome to nyaadenwa",
        welcome_description: "manage your phone directly on your browser :D",
        welcome_manual: "Click the <0>+</0> button to get started",
        fork_github: "Fork nyaadenwa on GitHub",
        github_repo: "GitHub repository",
        released_under_mit_license: "Released under MIT license",
        ok: "OK",
        cancel: "Cancel",
        confirm: "Confirm",
        close: "Close",
        commit: "Commit",
        commit_date: "Commit date",
        translation_authors: "Translation authors",
        all_contributors: "All contributors",
        device_disconnected: "Device disconnected",
        device_disconnected_description: "The following devices are disconnected:",
        device_access_denied: "Device access denied",
        device_access_denied_description:
            "{{device}} is not authorized to access the device. Make sure you have choosen File Transfer mode in the USB connection settings or enabled developer options and USB debugging on the device.",
        device_busy: "Device busy",
        device_busy_description:
            '{{device}} is already in use by another program. Please close the program and try again. You can try to stop ADB running on your machine by running the command "adb kill-server" in the terminal.',
        cannot_connect_device: "Cannot connect device",
        cannot_connect_device_description:
            "An error occurred while connecting to the device. Please try again. Check console for more details.",
        CONNECTING: "Connecting",
        DISCONNECTED: "Disconnected",
        CONNECTED: "Connected",
        device_attached: "Device attached",
        connecting_to_device: "Connecting to device...",
        waiting_for_device: "Waiting for device...",
    },
};

export default Locale;
