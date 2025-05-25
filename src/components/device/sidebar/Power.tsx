/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import useDialog from "@/components/dialog/Dialog";
import { DropdownMenu, Text } from "@radix-ui/themes";
import { Adb } from "@yume-chan/adb";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { PiPowerDuotone, PiWarningDuotone, PiCommandDuotone } from "react-icons/pi";
import {
    MdEmergency,
    MdDownload,
    MdFlashOn,
    MdOutlineSystemSecurityUpdateWarning,
    MdRestartAlt,
    MdRotateLeft,
    MdSystemUpdate,
} from "react-icons/md";

export default function Power({ close, adb }: { close: () => void; adb: Adb }) {
    const { t } = useTranslation();
    const dialog = useDialog();

    const handlePower = useCallback(
        (
            type:
                | "shutdown"
                | "reboot"
                | "recovery"
                | "bootloader"
                | "fastboot"
                | "samsung_odin"
                | "sideload"
                | "edl"
                | "custom",
        ) => {
            if (type === "custom") {
                dialog.prompt(
                    t("custom_reboot_command"),
                    t("confirm_power_action_description_custom"),
                    [
                        {
                            label: t("command"),
                            placeholder: "recovery",
                            validate: (value) => value.trim() !== "" && value.trim() !== "recovery" && value.trim() !== "bootloader" && value.trim() !== "fastboot" && value.trim() !== "sideload",
                        },
                    ],
                    (value, close) => {
                        if (value[0]) {
                            adb.power.reboot(value[0]);
                            close();
                        } else {
                            toast.error(t("please_enter_command"));
                        }
                    },
                );
                return;
            }
            dialog.confirm(
                t("confirm_power_action"),
                <>
                    <Text>{t("confirm_power_action_description_" + type)}</Text>
                </>,
                async () => {
                    try {
                        switch (type) {
                            case "shutdown":
                                await adb.power.powerOff();
                                break;
                            case "reboot":
                                await adb.power.reboot();
                                break;
                            case "recovery":
                                await adb.power.recovery();
                                break;
                            case "sideload":
                                await adb.power.sideload();
                                break;
                            case "bootloader":
                                await adb.power.bootloader();
                                break;
                            case "fastboot":
                                await adb.power.fastboot();
                                break;
                            case "samsung_odin":
                                await adb.power.samsungOdin();
                                break;
                            case "edl":
                                await adb.power.qualcommEdlMode();
                                break;
                        }
                        toast.success(t("power_action_success"));
                        close();
                    } catch (error) {
                        toast.error(t("power_action_error"));
                        console.error(error);
                    }
                },
            );
        },
        [t, adb, close, dialog],
    );

    return (
        <DropdownMenu.Content variant="soft">
            <DropdownMenu.Item onClick={() => handlePower("shutdown")}>
                <PiPowerDuotone size={20} />
                {t("shutdown")}
            </DropdownMenu.Item>
            <DropdownMenu.Item onClick={() => handlePower("reboot")}>
                <MdRestartAlt size={20} />
                {t("reboot")}
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Sub>
                <DropdownMenu.SubTrigger>
                    <PiWarningDuotone size={20} />
                    {t("advanced_power_options")}
                </DropdownMenu.SubTrigger>
                <DropdownMenu.SubContent>
                    <DropdownMenu.Item onClick={() => handlePower("recovery")}>
                        <MdRotateLeft size={20} />
                        {t("recovery")}
                    </DropdownMenu.Item>
                    <DropdownMenu.Item onClick={() => handlePower("sideload")}>
                        <MdDownload size={20} />
                        {t("sideload")}
                    </DropdownMenu.Item>
                    <DropdownMenu.Item onClick={() => handlePower("bootloader")}>
                        <MdOutlineSystemSecurityUpdateWarning size={20} />
                        {t("bootloader")}
                    </DropdownMenu.Item>
                    <DropdownMenu.Item onClick={() => handlePower("fastboot")}>
                        <MdFlashOn size={20} />
                        {t("fastboot")}
                    </DropdownMenu.Item>
                    <DropdownMenu.Item onClick={() => handlePower("samsung_odin")}>
                        <MdSystemUpdate size={20} />
                        {t("samsung_download_mode")}
                    </DropdownMenu.Item>
                    <DropdownMenu.Item onClick={() => handlePower("edl")}>
                        <MdEmergency size={20} />
                        {t("qualcomm_edl_mode")}
                    </DropdownMenu.Item>
                    <DropdownMenu.Item onClick={() => handlePower("custom")}>
                        <PiCommandDuotone size={20} />
                        {t("custom_command")}
                    </DropdownMenu.Item>
                </DropdownMenu.SubContent>
            </DropdownMenu.Sub>
        </DropdownMenu.Content>
    );
}
