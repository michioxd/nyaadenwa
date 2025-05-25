/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import { TConfig } from "@/controller/config";
import { GitHubLogoIcon, InfoCircledIcon, Pencil1Icon } from "@radix-ui/react-icons";
import { Badge, Button, Callout, Flex, Link, Select, Separator, Text, TextField } from "@radix-ui/themes";
import { observer } from "mobx-react";
import { type Dispatch, type SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import { SettingContainer, SettingSwitch } from "./useful_component";
import { formatBitrate } from "@/utils/str";

const SettingsScrcpy = observer(({ config, setConfig }: { config: TConfig, setConfig: Dispatch<SetStateAction<TConfig>> }) => {
    const { t } = useTranslation();

    return <>
        <Flex direction="row" gap="2" style={{ width: "100%" }} align="center">
            <Button asChild color="gray" variant="soft">
                <Link href="https://github.com/Genymobile/scrcpy" color="gray" target="_blank">
                    <GitHubLogoIcon />
                    {t('scrcpy_on_github')}
                </Link>
            </Button>

            <Button asChild color="gray" variant="soft">
                <Link href="https://github.com/Genymobile/scrcpy/blob/master/LICENSE" color="gray" target="_blank">
                    <Pencil1Icon />
                    {t('license')}
                </Link>
            </Button>
        </Flex>
        <Callout.Root size="1" style={{ width: "100%" }}>
            <Callout.Icon>
                <InfoCircledIcon />
            </Callout.Icon>
            <Callout.Text style={{ display: "flex", flexDirection: "column", gap: "0rem" }}>
                <Text size="2" weight="bold">{t('scrcpy_useful_tip_title')}</Text>
                <Text size="1">{t('scrcpy_useful_tip_description').split('\n').map((line, i) => (
                    <>
                        {line}
                        {i < t('scrcpy_useful_tip_description').split('\n').length - 1 && <br />}
                    </>
                ))}</Text>
            </Callout.Text>
        </Callout.Root>
        <SettingSwitch
            checked={config.scrcpy.enable}
            onCheckedChange={(checked) => {
                setConfig(p => ({
                    ...p,
                    scrcpy: {
                        ...p.scrcpy,
                        enable: checked
                    }
                }));
            }}
            label={t('scrcpy_enable')}
            description={t('scrcpy_enable_description')}
        />
        {config.scrcpy.enable && <>
            <SettingContainer label={t('scrcpy_log_level')} description={t('scrcpy_log_level_description')}>
                <Select.Root value={config.scrcpy.config.logLevel} onValueChange={(value) => {
                    setConfig(p => ({
                        ...p,
                        scrcpy: {
                            ...p.scrcpy,
                            config: {
                                ...p.scrcpy.config,
                                logLevel: value as "verbose" | "debug" | "info" | "warn" | "error"
                            }
                        }
                    }));
                }}>
                    <Select.Trigger />
                    <Select.Content>
                        <Select.Item value="verbose">
                            {t('scrcpy_log_level_verbose')}
                        </Select.Item>
                        <Select.Item value="debug">
                            {t('scrcpy_log_level_debug')}
                        </Select.Item>
                        <Select.Item value="info">
                            {t('scrcpy_log_level_info')}
                        </Select.Item>
                        <Select.Item value="warn">
                            {t('scrcpy_log_level_warn')}
                        </Select.Item>
                        <Select.Item value="error">
                            {t('scrcpy_log_level_error')}
                        </Select.Item>
                    </Select.Content>
                </Select.Root>
            </SettingContainer>
            <SettingSwitch
                checked={config.scrcpy.config.control ?? true}
                onCheckedChange={(checked) => {
                    setConfig(p => ({
                        ...p,
                        scrcpy: {
                            ...p.scrcpy,
                            config: {
                                ...p.scrcpy.config,
                                control: checked
                            }
                        }
                    }));
                }}
                label={t('scrcpy_control')}
                description={t('scrcpy_enable_control_description')}
            />
            <Separator style={{ width: "100%" }} />
            {/* Begin video settings */}
            <SettingSwitch
                checked={true}
                onCheckedChange={() => { }}
                disabled={true}
                label={t('scrcpy_video')}
                description={t('scrcpy_enable_video_description')}
            />
            <SettingContainer label={t('scrcpy_video_bitrate')} description={t('scrcpy_video_bitrate_description')}>
                <TextField.Root
                    value={config.scrcpy.config.videoBitRate?.toString() ?? ""}
                    type="number"
                    onChange={(e) => {
                        setConfig(p => ({
                            ...p,
                            scrcpy: {
                                ...p.scrcpy,
                                config: {
                                    ...p.scrcpy.config,
                                    videoBitRate: e.target.value ? parseInt(e.target.value) : 0
                                }
                            }
                        }));
                    }}
                >
                    <TextField.Slot>
                        <Badge>
                            bps
                        </Badge>
                    </TextField.Slot>
                    <TextField.Slot>
                        <Badge color="red">
                            {formatBitrate(config.scrcpy.config.videoBitRate ?? 0)}
                        </Badge>
                    </TextField.Slot>
                </TextField.Root>
            </SettingContainer>
            <SettingContainer label={t('scrcpy_video_display_id')} description={t('scrcpy_video_display_id_description')}>
                <TextField.Root
                    value={config.scrcpy.config.displayId?.toString() ?? ""}
                    type="number"
                    onChange={(e) => {
                        setConfig(p => ({
                            ...p,
                            scrcpy: {
                                ...p.scrcpy,
                                config: {
                                    ...p.scrcpy.config,
                                    displayId: e.target.value ? parseInt(e.target.value) : 0
                                }
                            }
                        }));
                    }}
                >
                </TextField.Root>
            </SettingContainer>
            <SettingContainer label={t('scrcpy_video_max_size')} description={t('scrcpy_video_max_size_description')}>
                <TextField.Root
                    value={config.scrcpy.config.maxSize?.toString() ?? ""}
                    type="number"
                    onChange={(e) => {
                        setConfig(p => ({
                            ...p,
                            scrcpy: {
                                ...p.scrcpy,
                                config: {
                                    ...p.scrcpy.config,
                                    maxSize: e.target.value ? parseInt(e.target.value) : 0
                                }
                            }
                        }));
                    }}
                >
                    <TextField.Slot>
                        <Badge>
                            pixel
                        </Badge>
                    </TextField.Slot>
                </TextField.Root>
            </SettingContainer>
            <SettingContainer label={t('scrcpy_video_max_fps')} description={t('scrcpy_video_max_fps_description')}>
                <TextField.Root
                    value={config.scrcpy.config.maxFps?.toString() ?? ""}
                    type="number"
                    onChange={(e) => {
                        setConfig(p => ({
                            ...p,
                            scrcpy: {
                                ...p.scrcpy,
                                config: {
                                    ...p.scrcpy.config,
                                    maxFps: e.target.value ? parseInt(e.target.value) : 0
                                }
                            }
                        }));
                    }}
                >
                    <TextField.Slot>
                        <Badge>
                            FPS
                        </Badge>
                    </TextField.Slot>
                </TextField.Root>
            </SettingContainer>
            {/* End video settings */}
            <Separator style={{ width: "100%" }} />
            {/* Begin audio settings */}
            <SettingSwitch
                checked={config.scrcpy.config.audio ?? true}
                onCheckedChange={(checked) => {
                    setConfig(p => ({
                        ...p,
                        scrcpy: {
                            ...p.scrcpy,
                            config: {
                                ...p.scrcpy.config,
                                audio: checked
                            }
                        }
                    }));
                }}
                label={t('scrcpy_audio')}
                description={t('scrcpy_enable_audio_description')}
            />
            {config.scrcpy.config.audio && <>
                <SettingContainer label={t('scrcpy_audio_source')} description={t('scrcpy_audio_source_description')}>
                    <Select.Root value={config.scrcpy.config.audioSource} onValueChange={(value) => {
                        setConfig(p => ({
                            ...p,
                            scrcpy: {
                                ...p.scrcpy,
                                config: {
                                    ...p.scrcpy.config,
                                    audioSource: value as "playback" | "output" | "mic"
                                }
                            }
                        }));
                    }}>
                        <Select.Trigger />
                        <Select.Content>
                            <Select.Item value="playback">
                                {t('scrcpy_audio_source_playback')}
                            </Select.Item>
                            <Select.Item value="output">
                                {t('scrcpy_audio_source_output')}
                            </Select.Item>
                            <Select.Item value="mic">
                                {t('scrcpy_audio_source_mic')}
                            </Select.Item>
                        </Select.Content>
                    </Select.Root>
                </SettingContainer>
                <SettingContainer label={t('scrcpy_audio_codec')} description={t('scrcpy_audio_codec_description')}>
                    <Select.Root defaultValue="opus" disabled>
                        <Select.Trigger />
                        <Select.Content>
                            <Select.Item value="opus">
                                Opus
                            </Select.Item>
                        </Select.Content>
                    </Select.Root>
                </SettingContainer>
                <SettingContainer label={t('scrcpy_audio_bitrate')} description={t('scrcpy_audio_bitrate_description')}>
                    <TextField.Root
                        value={config.scrcpy.config.audioBitRate?.toString() ?? ""}
                        type="number"
                        onChange={(e) => {
                            setConfig(p => ({
                                ...p,
                                scrcpy: {
                                    ...p.scrcpy,
                                    config: {
                                        ...p.scrcpy.config,
                                        audioBitRate: e.target.value ? parseInt(e.target.value) : 0
                                    }
                                }
                            }));
                        }}
                    >
                        <TextField.Slot>
                            <Badge>
                                bps
                            </Badge>
                        </TextField.Slot>
                        <TextField.Slot>
                            <Badge color="red">
                                {formatBitrate(config.scrcpy.config.audioBitRate ?? 0)}
                            </Badge>
                        </TextField.Slot>
                    </TextField.Root>
                </SettingContainer>
            </>}
            {/* End audio settings */}
        </>}
    </>
});

export default SettingsScrcpy;