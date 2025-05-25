/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import { Button, Flex, IconButton, ScrollArea, Select, Separator, Text } from "@radix-ui/themes";
import cls from "./Settings.module.scss";
import { useTranslation } from "react-i18next";
import { PiAndroidLogoDuotone, PiArrowCounterClockwise, PiFloppyDiskDuotone, PiScreencastDuotone, PiTrashDuotone, PiUsbDuotone } from "react-icons/pi";
import { observer } from "mobx-react";
import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from "react";
import tabsController from "@/controller/tabs";
import ConfigController, { type TConfig } from "@/controller/config";
import SettingsScrcpy from "@/components/settings/scrcpy";
import _ from "lodash";
import useDialog from "@/components/dialog/Dialog";

type SettingsSectionType = "scrcpy" | "device";


const SettingsList: {
    id: SettingsSectionType,
    label: string,
    description: string,
    icon: React.ElementType,
    notGlobal?: boolean,
    component: (config: TConfig, setConfig: Dispatch<SetStateAction<TConfig>>) => React.ReactNode
}[] = [
        // {
        //     id: "device",
        //     label: "this_device_settings",
        //     description: "this_device_settings_description",
        //     icon: PiPhoneDuotone,
        //     notGlobal: true,
        //     component: () => <></>
        // },
        {
            id: "scrcpy",
            label: "scrcpy",
            description: "scrcpy_settings_description",
            icon: PiScreencastDuotone,
            notGlobal: false,
            component: (config, setConfig) => <SettingsScrcpy config={config} setConfig={setConfig} />
        }
    ];

const Settings = observer(() => {
    const dialog = useDialog();
    const { t } = useTranslation();
    const [selectedSection, setSelectedSection] = useState<SettingsSectionType>("scrcpy");
    const [selectedDevice, setSelectedDevice] = useState<{
        type: 'websocket' | 'usb',
        id: string
    } | null>(null);
    const [config, setConfig] = useState<TConfig>(ConfigController.defaultConfig);
    const [configBackup, setConfigBackup] = useState<TConfig>(ConfigController.defaultConfig);

    const tabs = useMemo(() => tabsController.tabs.map((tab) => tab.id.length === 40 ? {
        label: tab.title.replace("WS: ", ""),
        id: tab.id,
        type: tab.title.startsWith("WS: ") ? "websocket" : "usb",
    } : null).filter((tab) => tab !== null)
        , [tabsController.tabs]);

    const tabsUsb = useMemo(() => {
        return tabs.filter((tab) => tab.type === "usb");
    }, [tabs]);

    const tabsWebsocket = useMemo(() => {
        return tabs.filter((tab) => tab.type === "websocket");
    }, [tabs]);

    useEffect(() => {
        if (!selectedDevice) return;

        if (!tabs.find((tab) => tab.id === selectedDevice.id)) {
            setSelectedDevice(null);
            setSelectedSection(SettingsList.find((item) => !item.notGlobal)?.id || "scrcpy");
        }
    }, [tabs, selectedDevice]);

    useEffect(() => {
        const config = new ConfigController(selectedDevice?.id ?? "global", selectedDevice?.type ?? "usb");
        setConfig(config.getConfig());
        setConfigBackup(config.getConfig());
    }, [selectedDevice]);

    const selectedSectionContent = useMemo(() => {
        return SettingsList.find((item) => item.id === selectedSection);
    }, [selectedSection]);

    return <div className={cls.settings}>
        <div className={cls.main}>
            <div className={cls.sidebar}>
                <Text size="3" weight="bold">{t("settings")}</Text>

                <Flex direction="column" gap="1" style={{ width: "100%" }}>
                    <Text size="1">{t("select_device")}</Text>
                    <Select.Root defaultValue="global" size="1" onValueChange={(value) => {
                        if (value === "global") {
                            setSelectedDevice(null);
                        } else {
                            setSelectedDevice({ type: value.startsWith("w:") ? "websocket" : "usb", id: value.replace("w:", "").replace("u:", "") });
                        }
                    }} value={selectedDevice ? (selectedDevice.type === "websocket" ? "w:" + selectedDevice.id : "u:" + selectedDevice.id) : "global"}>
                        <Select.Trigger />
                        <Select.Content variant="soft">
                            <Select.Item value="global">{t('all_devices')}</Select.Item>
                            <Select.Group>
                                <Select.Label>
                                    <PiUsbDuotone size={16} style={{ marginRight: "0.25rem" }} />
                                    {t('usb')}
                                </Select.Label>
                                {tabsUsb.length > 0 ? tabsUsb.map((tab) => (
                                    <Select.Item key={tab.id} value={"u:" + tab.id}>
                                        {tab.label}
                                    </Select.Item>
                                )) : (
                                    <Select.Item disabled value="usb">
                                        {t('no_opeining_usb_devices')}
                                    </Select.Item>
                                )}
                            </Select.Group>
                            <Select.Group>
                                <Select.Label>
                                    <PiAndroidLogoDuotone size={16} style={{ marginRight: "0.25rem" }} />
                                    {t('websocket_adb')}
                                </Select.Label>
                                {tabsWebsocket.length > 0 ? tabsWebsocket.map((tab) => (
                                    <Select.Item key={tab.id} value={"w:" + tab.id}>
                                        {tab.label}
                                    </Select.Item>
                                )) : (
                                    <Select.Item disabled value="websocket">
                                        {t('no_opeining_websocket_devices')}
                                    </Select.Item>
                                )}
                            </Select.Group>
                        </Select.Content>
                    </Select.Root>
                </Flex>

                <Flex direction="column" gap="2" style={{ width: "100%" }}>
                    <Button
                        disabled={_.isEqual(config, configBackup)}
                        variant="soft" color="cyan" size="2" style={{ width: "100%" }}
                        onClick={() => {
                            const cfg = new ConfigController(selectedDevice?.id ?? "global", selectedDevice?.type ?? "usb");
                            cfg.setConfig(config);
                            setConfigBackup(config);
                        }}
                    >
                        <PiFloppyDiskDuotone size={18} />
                        {t('save_settings')}
                    </Button>

                    {selectedDevice ?
                        <Button variant="soft" color="red" size="2" style={{ width: "100%" }} onClick={async () => {
                            const confirm = await (() => new Promise((resolve) => {
                                dialog.confirm(
                                    t('clear_settings'),
                                    t('clear_settings_description'),
                                    () => resolve(true),
                                    () => resolve(false),
                                );
                            }))();

                            if (confirm) {
                                const cfg = new ConfigController(selectedDevice?.id ?? "global", selectedDevice?.type ?? "usb");
                                cfg.clearConfig();
                                setConfig(ConfigController.defaultConfig);
                                setConfigBackup(ConfigController.defaultConfig);
                                setSelectedDevice(null);
                            }
                        }}>
                            <PiTrashDuotone size={18} />
                            {t('clear_settings')}
                        </Button>
                        : <Button variant="soft" color="red" size="2" style={{ width: "100%" }} onClick={async () => {
                            const confirm = await (() => new Promise((resolve) => {
                                dialog.confirm(
                                    t('reset_settings'),
                                    t('reset_settings_description'),
                                    () => resolve(true),
                                    () => resolve(false),
                                );
                            }))();

                            if (confirm) {
                                const cfg = new ConfigController("global", "usb");
                                cfg.clearConfig();
                                setConfig(ConfigController.defaultConfig);
                                setConfigBackup(ConfigController.defaultConfig);
                            }
                        }}>
                            <PiArrowCounterClockwise size={18} />
                            {t('reset_settings')}
                        </Button>}
                </Flex>

                <Flex direction="column" gap="2" style={{ width: "100%" }}>
                    {SettingsList.map((item) => (!selectedDevice && item.notGlobal) ? null : (
                        <Button
                            key={item.id}
                            variant="ghost"
                            color={selectedSection === item.id ? "cyan" : "gray"}
                            size="1"
                            className={cls.button} onClick={() => setSelectedSection(item.id)}>
                            <IconButton variant="soft"
                                asChild
                                color={selectedSection === item.id ? "cyan" : "gray"}
                                size="1"
                            >
                                <span>
                                    <item.icon size={16} />
                                </span>
                            </IconButton>
                            {t(item.label)}
                        </Button>
                    ))}
                </Flex>
            </div>
            <Separator orientation="vertical" className={cls.separator} />
            <ScrollArea>
                <div className={cls.content}>
                    {selectedSectionContent && <>
                        <Flex direction="column" gap="1" style={{ width: "100%" }}>
                            <Text size="3" weight="bold">{t(selectedSectionContent.label)}</Text>
                            <Text size="1" color="gray">{t(selectedSectionContent.description)}</Text>
                        </Flex>
                        {selectedSectionContent.component(config, setConfig)}
                    </>}
                </div>
            </ScrollArea>
        </div>
    </div>;
});


export default Settings;