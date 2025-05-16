/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import cls from "@/screen/Device.module.scss";
import { Button, Card, DropdownMenu, Flex, IconButton, Text } from "@radix-ui/themes";
import { PiCommandDuotone, PiFolderOpenDuotone, PiInfoDuotone, PiPowerDuotone, PiTerminalWindowDuotone, PiWarningDuotone } from "react-icons/pi";
import { useTranslation } from "react-i18next";
import { useCallback, useMemo } from "react";
import { accentColorPropDef } from "@radix-ui/themes/src/props/color.prop.ts";
import clsx from "clsx";
import { MdApps, MdDownload, MdEmergency, MdFlashOn, MdOutlineSystemSecurityUpdateWarning, MdRestartAlt, MdRotateLeft, MdSystemUpdate } from "react-icons/md";
import useDialog from "../dialog/Dialog";
import { Adb } from "@yume-chan/adb";
import { toast } from "sonner";

export default function DeviceSidebar({ sidebarLevel, adb, close }: { sidebarLevel: number, adb: Adb, close: () => void }) {
    const { t } = useTranslation();
    const dialog = useDialog();

    const handlePower = useCallback((type: "shutdown" | "reboot" | "recovery" | "bootloader" | "fastboot" | "samsung_odin" | "sideload" | "edl" | "custom") => {
        if (type === "custom") {
            dialog.prompt(t("confirm_power_action"), t("confirm_power_action_description_custom"), [{
                label: t("command"),
                placeholder: "recovery",
            }],
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
        dialog.confirm(t("confirm_power_action"), <>
            <Text>{t("confirm_power_action_description_" + type)}</Text>
        </>, async () => {
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
        });
    }, [t, adb, close, dialog]);

    const sbItem = useMemo<
        {
            icon: React.ReactNode;
            text: React.ReactNode;
            color: (typeof accentColorPropDef)["color"]["values"][number];
            onClick?: () => void;
        }[]
    >(
        () => [
            {
                icon: <PiInfoDuotone size={20} />,
                text: t("device_info"),
                color: "gray",
            },
            {
                icon: <PiTerminalWindowDuotone size={20} />,
                text: t("terminal"),
                color: "gray",
            },
            {
                icon: <PiFolderOpenDuotone size={20} />,
                text: t("file_manager"),
                color: "gray",
            },
            {
                icon: <MdApps size={20} />,
                text: t("apps_manager"),
                color: "gray",
            },
        ],
        [t],
    );

    if (sidebarLevel === 0) return null;

    return (
        <div className={cls.DeviceSidebar}>
            <Card className={clsx(cls.Sidebar, sidebarLevel === 2 && cls.Expand)}>
                <Flex gap="2" className={cls.SidebarContent} direction="column">
                    {sbItem.map((item, index) =>
                        sidebarLevel === 2 ? (
                            <Button
                                key={index}
                                className={cls.SidebarButton}
                                variant="ghost"
                                color={item.color}
                                onClick={item.onClick}
                            >
                                <IconButton asChild variant="soft" color={item.color}>
                                    <span>{item.icon}</span>
                                </IconButton>
                                <Text ml="1" className={cls.SbText}>
                                    {item.text}
                                </Text>
                            </Button>
                        ) : (
                            <IconButton key={index} variant="soft" color={item.color} onClick={item.onClick}>
                                {item.icon}
                            </IconButton>
                        ),
                    )}
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger>
                            {
                                sidebarLevel === 2 ? (
                                    <Button
                                        className={cls.SidebarButton}
                                        variant="ghost"
                                        color="gray"
                                    >
                                        <IconButton asChild variant="soft" color="gray">
                                            <span>
                                                <PiPowerDuotone size={20} />
                                            </span>
                                        </IconButton>
                                        <Text ml="1" className={cls.SbText}>
                                            {t("power")}
                                        </Text>
                                    </Button>
                                ) : (
                                    <IconButton variant="soft" color="gray">
                                        <PiPowerDuotone size={20} />
                                    </IconButton>
                                )
                            }
                        </DropdownMenu.Trigger>
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
                    </DropdownMenu.Root>
                </Flex>
            </Card>
        </div>
    );
}
