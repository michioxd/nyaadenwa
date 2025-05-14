/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import cls from "@/screen/Device.module.scss";
import { Button, Card, Flex, IconButton, Text } from "@radix-ui/themes";
import { PiFolderOpenDuotone, PiInfoDuotone, PiTerminalWindowDuotone } from "react-icons/pi";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { accentColorPropDef } from "@radix-ui/themes/src/props/color.prop.ts";

export default function DeviceSidebar({ sidebarLevel }: { sidebarLevel: number }) {
    const { t } = useTranslation();

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
        ],
        [t],
    );

    if (sidebarLevel === 0) return null;

    return (
        <div className={cls.DeviceSidebar}>
            <Card className={cls.Sidebar}>
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
                                <Text ml="1">{item.text}</Text>
                            </Button>
                        ) : (
                            <IconButton key={index} variant="soft" color={item.color} onClick={item.onClick}>
                                {item.icon}
                            </IconButton>
                        ),
                    )}
                </Flex>
            </Card>
        </div>
    );
}
