/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import { TConfig } from "@/controller/config";
import type { Dispatch, SetStateAction } from "react";
import { SettingContainer, SettingSwitch } from "./useful_component";
import { Trans, useTranslation } from "react-i18next";
import { Badge, Callout, Link, Select, Separator, TextField } from "@radix-ui/themes";
import { PackageManagerInstallLocation, PackageManagerInstallReason } from "@yume-chan/android-bin";
import { SingleUserOrAll } from "@yume-chan/android-bin/esm/utils";
import { InfoCircledIcon } from "@radix-ui/react-icons";

export default function SettingsInstallApk({
    config,
    setConfig,
}: {
    config: TConfig;
    setConfig: Dispatch<SetStateAction<TConfig>>;
}) {
    const { t } = useTranslation();
    return (
        <>
            <SettingSwitch
                checked={config.install_apk.useOptions}
                onCheckedChange={(checked) => {
                    setConfig((p) => ({ ...p, install_apk: { ...p.install_apk, useOptions: checked } }));
                }}
                label={<>{t("install_apk_cfg_use_options")}</>}
                description={t("install_apk_cfg_use_options_description")}
            />
            {config.install_apk.useOptions && (
                <>
                    <Separator style={{ width: "100%" }} />
                    <Callout.Root style={{ width: "100%" }} size="1">
                        <Callout.Icon>
                            <InfoCircledIcon />
                        </Callout.Icon>
                        <Callout.Text>
                            <Trans i18nKey="install_apk_cfg_more_info_link">
                                <Link
                                    color="cyan"
                                    weight="bold"
                                    href="https://cs.android.com/android/platform/superproject/+/master:frameworks/base/services/core/java/com/android/server/pm/PackageManagerShellCommand.java;drc=5770e468a7d6f35363e620e17d5df3dd10665580"
                                    target="_blank"
                                />
                            </Trans>
                        </Callout.Text>
                    </Callout.Root>
                    <SettingSwitch
                        checked={config.install_apk.options.allowTest}
                        onCheckedChange={(checked) => {
                            setConfig((p) => ({
                                ...p,
                                install_apk: {
                                    ...p.install_apk,
                                    options: { ...p.install_apk.options, allowTest: checked },
                                },
                            }));
                        }}
                        label={
                            <>
                                {t("install_apk_cfg_allow_test")}
                                <Badge size="1" ml="2" color="gray">
                                    -t
                                </Badge>
                            </>
                        }
                        description={t("install_apk_cfg_allow_test_description")}
                    />
                    <SettingContainer
                        label={
                            <>
                                {t("install_apk_cfg_abi")}
                                <Badge size="1" ml="2" color="gray">
                                    --abi
                                </Badge>
                            </>
                        }
                        description={t("install_apk_cfg_abi_description")}
                    >
                        <TextField.Root
                            value={config.install_apk.options.abi?.toString() ?? ""}
                            onChange={(e) => {
                                setConfig((p) => ({
                                    ...p,
                                    install_apk: {
                                        ...p.install_apk,
                                        options: { ...p.install_apk.options, abi: e.target.value },
                                    },
                                }));
                            }}
                        />
                    </SettingContainer>
                    <SettingSwitch
                        checked={config.install_apk.options.bypassLowTargetSdkBlock}
                        onCheckedChange={(checked) => {
                            setConfig((p) => ({
                                ...p,
                                install_apk: {
                                    ...p.install_apk,
                                    options: { ...p.install_apk.options, bypassLowTargetSdkBlock: checked },
                                },
                            }));
                        }}
                        label={
                            <>
                                {t("install_apk_cfg_bypass_low_target_sdk_block")}
                                <Badge size="1" ml="2" color="gray">
                                    --bypass-low-target-sdk-block
                                </Badge>
                            </>
                        }
                        description={t("install_apk_cfg_bypass_low_target_sdk_block_description")}
                    />
                    <SettingSwitch
                        checked={config.install_apk.options.doNotKill}
                        onCheckedChange={(checked) => {
                            setConfig((p) => ({
                                ...p,
                                install_apk: {
                                    ...p.install_apk,
                                    options: { ...p.install_apk.options, doNotKill: checked },
                                },
                            }));
                        }}
                        label={
                            <>
                                {t("install_apk_cfg_do_not_kill")}
                                <Badge size="1" ml="2" color="gray">
                                    --dont-kill
                                </Badge>
                            </>
                        }
                        description={t("install_apk_cfg_do_not_kill_description")}
                    />
                    <SettingSwitch
                        checked={config.install_apk.options.enableRollback}
                        onCheckedChange={(checked) => {
                            setConfig((p) => ({
                                ...p,
                                install_apk: {
                                    ...p.install_apk,
                                    options: { ...p.install_apk.options, enableRollback: checked },
                                },
                            }));
                        }}
                        label={
                            <>
                                {t("install_apk_cfg_enable_rollback")}
                                <Badge size="1" ml="2" color="gray">
                                    --enable-rollback
                                </Badge>
                            </>
                        }
                        description={t("install_apk_cfg_enable_rollback_description")}
                    />
                    <SettingSwitch
                        checked={config.install_apk.options.forceNonStaged}
                        onCheckedChange={(checked) => {
                            setConfig((p) => ({
                                ...p,
                                install_apk: {
                                    ...p.install_apk,
                                    options: { ...p.install_apk.options, forceNonStaged: checked },
                                },
                            }));
                        }}
                        label={
                            <>
                                {t("install_apk_cfg_force_non_staged")}
                                <Badge size="1" ml="2" color="gray">
                                    --force-non-staged
                                </Badge>
                            </>
                        }
                        description={t("install_apk_cfg_force_non_staged_description")}
                    />
                    <SettingSwitch
                        checked={config.install_apk.options.forceQueryable}
                        onCheckedChange={(checked) => {
                            setConfig((p) => ({
                                ...p,
                                install_apk: {
                                    ...p.install_apk,
                                    options: { ...p.install_apk.options, forceQueryable: checked },
                                },
                            }));
                        }}
                        label={
                            <>
                                {t("install_apk_cfg_force_queryable")}
                                <Badge size="1" ml="2" color="gray">
                                    --force-queryable
                                </Badge>
                            </>
                        }
                        description={t("install_apk_cfg_force_queryable_description")}
                    />
                    <SettingContainer
                        label={
                            <>
                                {t("install_apk_cfg_force_uuid")}
                                <Badge size="1" ml="2" color="gray">
                                    --force-uuid
                                </Badge>
                            </>
                        }
                        description={t("install_apk_cfg_force_uuid_description")}
                    >
                        <TextField.Root
                            value={config.install_apk.options.forceUuid?.toString() ?? ""}
                            onChange={(e) => {
                                setConfig((p) => ({
                                    ...p,
                                    install_apk: {
                                        ...p.install_apk,
                                        options: { ...p.install_apk.options, forceUuid: e.target.value },
                                    },
                                }));
                            }}
                        />
                    </SettingContainer>
                    <SettingSwitch
                        checked={config.install_apk.options.full}
                        onCheckedChange={(checked) => {
                            setConfig((p) => ({
                                ...p,
                                install_apk: { ...p.install_apk, options: { ...p.install_apk.options, full: checked } },
                            }));
                        }}
                        label={
                            <>
                                {t("install_apk_cfg_full")}
                                <Badge size="1" ml="2" color="gray">
                                    --full
                                </Badge>
                            </>
                        }
                        description={t("install_apk_cfg_full_description")}
                    />
                    <SettingSwitch
                        checked={config.install_apk.options.grantRuntimePermissions}
                        onCheckedChange={(checked) => {
                            setConfig((p) => ({
                                ...p,
                                install_apk: {
                                    ...p.install_apk,
                                    options: { ...p.install_apk.options, grantRuntimePermissions: checked },
                                },
                            }));
                        }}
                        label={
                            <>
                                {t("install_apk_cfg_grant_runtime_permissions")}
                                <Badge size="1" ml="2" color="gray">
                                    -g
                                </Badge>
                            </>
                        }
                        description={t("install_apk_cfg_grant_runtime_permissions_description")}
                    />
                    <SettingContainer
                        label={
                            <>
                                {t("install_apk_cfg_inherit_from")}
                                <Badge size="1" ml="2" color="gray">
                                    -p
                                </Badge>
                            </>
                        }
                        description={t("install_apk_cfg_inherit_from_description")}
                    >
                        <TextField.Root
                            value={config.install_apk.options.inheritFrom?.toString() ?? ""}
                            onChange={(e) => {
                                setConfig((p) => ({
                                    ...p,
                                    install_apk: {
                                        ...p.install_apk,
                                        options: { ...p.install_apk.options, inheritFrom: e.target.value },
                                    },
                                }));
                            }}
                        />
                    </SettingContainer>
                    <SettingSwitch
                        checked={config.install_apk.options.instantApp}
                        onCheckedChange={(checked) => {
                            setConfig((p) => ({
                                ...p,
                                install_apk: {
                                    ...p.install_apk,
                                    options: { ...p.install_apk.options, instantApp: checked },
                                },
                            }));
                        }}
                        label={
                            <>
                                {t("install_apk_cfg_instant_app")}
                                <Badge size="1" ml="2" color="gray">
                                    --instant
                                </Badge>
                            </>
                        }
                        description={t("install_apk_cfg_instant_app_description")}
                    />
                    <SettingContainer
                        label={
                            <>
                                {t("install_apk_cfg_install_location")}
                                <Badge size="1" ml="2" color="gray">
                                    --install-location
                                </Badge>
                            </>
                        }
                        description={t("install_apk_cfg_install_location_description")}
                    >
                        <Select.Root
                            value={config.install_apk.options.installLocation.toString()}
                            onValueChange={(value) => {
                                setConfig((p) => ({
                                    ...p,
                                    install_apk: {
                                        ...p.install_apk,
                                        options: {
                                            ...p.install_apk.options,
                                            installLocation: parseInt(value) as PackageManagerInstallLocation,
                                        },
                                    },
                                }));
                            }}
                        >
                            <Select.Trigger />
                            <Select.Content>
                                <Select.Item value="0">{t("install_apk_cfg_install_location_auto")}</Select.Item>
                                <Select.Item value="1">
                                    {t("install_apk_cfg_install_location_internal_only")}
                                </Select.Item>
                                <Select.Item value="2">
                                    {t("install_apk_cfg_install_location_prefer_external")}
                                </Select.Item>
                            </Select.Content>
                        </Select.Root>
                    </SettingContainer>
                    <SettingContainer
                        label={
                            <>
                                {t("install_apk_cfg_install_reason")}
                                <Badge size="1" ml="2" color="gray">
                                    --install-reason
                                </Badge>
                            </>
                        }
                        description={t("install_apk_cfg_install_reason_description")}
                    >
                        <Select.Root
                            value={config.install_apk.options.installReason.toString()}
                            onValueChange={(value) => {
                                setConfig((p) => ({
                                    ...p,
                                    install_apk: {
                                        ...p.install_apk,
                                        options: {
                                            ...p.install_apk.options,
                                            installReason: parseInt(value) as PackageManagerInstallReason,
                                        },
                                    },
                                }));
                            }}
                        >
                            <Select.Trigger />
                            <Select.Content>
                                <Select.Item value="0">{t("install_apk_cfg_install_reason_unknown")}</Select.Item>
                                <Select.Item value="1">{t("install_apk_cfg_install_reason_admin_policy")}</Select.Item>
                                <Select.Item value="2">
                                    {t("install_apk_cfg_install_reason_device_restore")}
                                </Select.Item>
                                <Select.Item value="3">{t("install_apk_cfg_install_reason_device_setup")}</Select.Item>
                                <Select.Item value="4">{t("install_apk_cfg_install_reason_user_request")}</Select.Item>
                            </Select.Content>
                        </Select.Root>
                    </SettingContainer>
                    <SettingContainer
                        label={
                            <>
                                {t("install_apk_cfg_installer_package_name")}
                                <Badge size="1" ml="2" color="gray">
                                    -i
                                </Badge>
                            </>
                        }
                        description={t("install_apk_cfg_installer_package_name_description")}
                    >
                        <TextField.Root
                            value={config.install_apk.options.installerPackageName?.toString() ?? ""}
                            onChange={(e) => {
                                setConfig((p) => ({
                                    ...p,
                                    install_apk: {
                                        ...p.install_apk,
                                        options: { ...p.install_apk.options, installerPackageName: e.target.value },
                                    },
                                }));
                            }}
                        />
                    </SettingContainer>
                    <SettingSwitch
                        checked={config.install_apk.options.internalStorage}
                        onCheckedChange={(checked) => {
                            setConfig((p) => ({
                                ...p,
                                install_apk: {
                                    ...p.install_apk,
                                    options: { ...p.install_apk.options, internalStorage: checked },
                                },
                            }));
                        }}
                        label={
                            <>
                                {t("install_apk_cfg_internal_storage")}
                                <Badge size="1" ml="2" color="gray">
                                    -f
                                </Badge>
                            </>
                        }
                        description={t("install_apk_cfg_internal_storage_description")}
                    />
                    <SettingContainer
                        label={
                            <>
                                {t("install_apk_cfg_originating_uri")}
                                <Badge size="1" ml="2" color="gray">
                                    --originating-uri
                                </Badge>
                            </>
                        }
                        description={t("install_apk_cfg_originating_uri_description")}
                    >
                        <TextField.Root
                            value={config.install_apk.options.originatingUri?.toString() ?? ""}
                            onChange={(e) => {
                                setConfig((p) => ({
                                    ...p,
                                    install_apk: {
                                        ...p.install_apk,
                                        options: { ...p.install_apk.options, originatingUri: e.target.value },
                                    },
                                }));
                            }}
                        />
                    </SettingContainer>
                    <SettingContainer
                        label={
                            <>
                                {t("install_apk_cfg_package_name")}
                                <Badge size="1" ml="2" color="gray">
                                    --pkg
                                </Badge>
                            </>
                        }
                        description={t("install_apk_cfg_package_name_description")}
                    >
                        <TextField.Root
                            value={config.install_apk.options.packageName?.toString() ?? ""}
                            onChange={(e) => {
                                setConfig((p) => ({
                                    ...p,
                                    install_apk: {
                                        ...p.install_apk,
                                        options: { ...p.install_apk.options, packageName: e.target.value },
                                    },
                                }));
                            }}
                        />
                    </SettingContainer>
                    <SettingSwitch
                        checked={config.install_apk.options.preload}
                        onCheckedChange={(checked) => {
                            setConfig((p) => ({
                                ...p,
                                install_apk: {
                                    ...p.install_apk,
                                    options: { ...p.install_apk.options, preload: checked },
                                },
                            }));
                        }}
                        label={
                            <>
                                {t("install_apk_cfg_preload")}
                                <Badge size="1" ml="2" color="gray">
                                    --preload
                                </Badge>
                            </>
                        }
                        description={t("install_apk_cfg_preload_description")}
                    />
                    <SettingSwitch
                        checked={config.install_apk.options.requestDowngrade}
                        onCheckedChange={(checked) => {
                            setConfig((p) => ({
                                ...p,
                                install_apk: {
                                    ...p.install_apk,
                                    options: { ...p.install_apk.options, requestDowngrade: checked },
                                },
                            }));
                        }}
                        label={
                            <>
                                {t("install_apk_cfg_request_downgrade")}
                                <Badge size="1" ml="2" color="gray">
                                    -d
                                </Badge>
                            </>
                        }
                        description={t("install_apk_cfg_request_downgrade_description")}
                    />
                    <SettingSwitch
                        checked={config.install_apk.options.skipExisting}
                        onCheckedChange={(checked) => {
                            setConfig((p) => ({
                                ...p,
                                install_apk: {
                                    ...p.install_apk,
                                    options: { ...p.install_apk.options, skipExisting: checked },
                                },
                            }));
                        }}
                        label={
                            <>
                                {t("install_apk_cfg_skip_existing")}
                                <Badge size="1" ml="2" color="gray">
                                    -R
                                </Badge>
                            </>
                        }
                        description={t("install_apk_cfg_skip_existing_description")}
                    />
                    <SettingSwitch
                        checked={config.install_apk.options.skipVerification}
                        onCheckedChange={(checked) => {
                            setConfig((p) => ({
                                ...p,
                                install_apk: {
                                    ...p.install_apk,
                                    options: { ...p.install_apk.options, skipVerification: checked },
                                },
                            }));
                        }}
                        label={
                            <>
                                {t("install_apk_cfg_skip_verification")}
                                <Badge size="1" ml="2" color="gray">
                                    --skip-verification
                                </Badge>
                            </>
                        }
                        description={t("install_apk_cfg_skip_verification_description")}
                    />
                    <SettingSwitch
                        checked={config.install_apk.options.staged}
                        onCheckedChange={(checked) => {
                            setConfig((p) => ({
                                ...p,
                                install_apk: {
                                    ...p.install_apk,
                                    options: { ...p.install_apk.options, staged: checked },
                                },
                            }));
                        }}
                        label={
                            <>
                                {t("install_apk_cfg_staged")}
                                <Badge size="1" ml="2" color="gray">
                                    --staged
                                </Badge>
                            </>
                        }
                        description={t("install_apk_cfg_staged_description")}
                    />
                    <SettingContainer
                        label={
                            <>
                                {t("install_apk_cfg_user")}
                                <Badge size="1" ml="2" color="gray">
                                    --user
                                </Badge>
                            </>
                        }
                        description={t("install_apk_cfg_user_description")}
                    >
                        <Select.Root
                            value={typeof config.install_apk.options.user === "number" ? "uid" : config.install_apk.options.user}
                            onValueChange={(value) => {
                                setConfig((p) => ({
                                    ...p,
                                    install_apk: {
                                        ...p.install_apk,
                                        options: {
                                            ...p.install_apk.options,
                                            user: value === "uid" ? 0 : value as SingleUserOrAll,
                                        },
                                    },
                                }));
                            }}
                        >
                            <Select.Trigger />
                            <Select.Content>
                                <Select.Item value="all">{t("install_apk_cfg_user_all")}</Select.Item>
                                <Select.Item value="current">{t("install_apk_cfg_user_current")}</Select.Item>
                                <Select.Item value="uid">{t("install_apk_cfg_user_uid")}</Select.Item>
                            </Select.Content>
                        </Select.Root>
                        {typeof config.install_apk.options.user === "number" && (
                            <TextField.Root
                                value={config.install_apk.options.user?.toString() ?? ""}
                                type="number"
                                placeholder={t("install_apk_cfg_user_uid_placeholder")}
                                onChange={(e) => {
                                    setConfig((p) => ({
                                        ...p,
                                        install_apk: {
                                            ...p.install_apk,
                                            options: { ...p.install_apk.options, user: parseInt(e.target.value) as SingleUserOrAll },
                                        },
                                    }));
                                }}
                            />
                        )}
                    </SettingContainer>
                </>
            )}
        </>
    );
}
