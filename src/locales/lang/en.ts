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
        welcome_manual_tooltip: "Not this button, the real one is on the top left header :)",
        welcome_manual: "Click the <0></0> button to get started",
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
        cannot_connect_websocket: "Cannot connect to WebSocket",
        cannot_connect_websocket_description:
            "An error occurred while connecting to the WebSocket. Please try again. Check console for more details.",
        webusb_not_supported: "WebUSB is not supported in this browser",
        CONNECTING: "Connecting",
        DISCONNECTED: "Disconnected",
        CONNECTED: "Connected",
        usb_device_connected: "An USB device connected",
        connecting_to_device: "Connecting to device...",
        waiting_for_device: "Waiting for device...",
        working_in_progress: "Working in progress",
        screenshot: "Screenshot",
        volume_up: "Volume up",
        volume_down: "Volume down",
        mute: "Mute",
        rotate_device: "Rotate device",
        turn_on_screen: "Turn on screen",
        turn_off_screen: "Turn off screen",
        recent_apps: "Recent apps",
        home: "Home",
        back: "Back",
        reset_video: "Reset video",
        show_controls: "Show controls",
        hide_controls: "Hide controls",
        enter_full_screen: "Enter full screen",
        exit_full_screen: "Exit full screen",
        keyboard_focused: "Keyboard focused",
        keyboard_unfocused: "Keyboard will not work when unfocused",
        save_to_file: "Save to file",
        copy_to_clipboard: "Copy to clipboard",
        screenshot_copied_to_clipboard: "Screenshot copied to clipboard",
        failed_to_take_screenshot: "Failed to take screenshot. Check console for more details.",
        open_in_window: "Open in child window",
        create_websocket_connection: "Create WebSocket connection",
        create_websocket_connection_description:
            "Enter the address of the WebSockify server. You may have to follow <0>this guide</0> to install it on your local machine to proxy local ADB connection.",
        invalid_websocket_address: "Invalid WebSocket address",
        error_while_starting_mirroring: "An error occurred while starting mirroring",
        address: "Address",
        usb: "USB",
        websocket_adb: "WebSocket (ADB)",
        file_manager: "File manager",
        terminal: "Terminal",
        device_info: "Device info",
        power: "Power",
        shutdown: "Shutdown",
        reboot: "Reboot",
        recovery: "Recovery",
        sideload: "Sideload",
        bootloader: "Bootloader",
        fastboot: "Fastboot",
        command: "Command",
        apps_manager: "Apps manager",
        power_action_success: "Power action successful",
        samsung_download_mode: "Samsung Download Mode (Odin)",
        qualcomm_edl_mode: "Qualcomm EDL mode",
        custom_command: "Custom command",
        advanced_power_options: "Advanced power options",
        confirm_power_action: "Confirm power action",
        please_enter_command: "Please enter the command",
        custom_reboot_command: "Custom reboot command",
        confirm_power_action_description_shutdown: "Are you sure you want to shutdown the device?",
        confirm_power_action_description_reboot: "Are you sure you want to reboot the device?",
        confirm_power_action_description_recovery: "Are you sure you want to reboot the device into recovery mode?",
        confirm_power_action_description_sideload: "Are you sure you want to reboot the device into sideload mode?",
        confirm_power_action_description_bootloader: "Are you sure you want to reboot the device into bootloader mode?",
        confirm_power_action_description_fastboot: "Are you sure you want to reboot the device into fastboot mode?",
        confirm_power_action_description_samsung_odin:
            "This feature is only available for Samsung devices. Are you sure you want to reboot the device into Samsung Odin mode?",
        confirm_power_action_description_edl:
            "This feature is only available for devices using Qualcomm SoC. Are you sure you want to reboot the device into Qualcomm EDL mode?",
        confirm_power_action_description_custom:
            'Please enter the custom command to reboot the device, you may only need to enter the command next to the reboot command, for example "reboot recovery" then only enter "recovery"',
    },
};

export default Locale;
