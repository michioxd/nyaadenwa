/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import { Button, Card, Checkbox, DropdownMenu, IconButton, Progress, Spinner, Table, Tabs, Text, TextField } from "@radix-ui/themes";
import cls from "./pm.module.scss";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PackageManager, PackageManagerListPackagesResult } from "@yume-chan/android-bin";
import { Adb } from "@yume-chan/adb";
import { useTranslation } from "react-i18next";
import { HamburgerMenuIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { PiAndroidLogoDuotone, PiArrowDown, PiArrowsClockwise, PiArrowUp, PiLockDuotone, PiLockOpenDuotone, PiTrashDuotone } from "react-icons/pi";
import useDialog, { DialogType } from "@/components/dialog/Dialog";
import { toast } from "sonner";
import { SingleUserOrAll } from "@yume-chan/android-bin/esm/utils";
import { runAdbCmd } from "@/utils/adb";
import { TConfig } from "@/controller/config";

function sortPackages(
    packages: PackageManagerListPackagesResult[],
    sortMode: {
        by: "packageName" | "versionCode" | "uid";
        type: "asc" | "desc";
    },
) {
    return packages.sort((a, b) => {
        const aValue = a[sortMode.by];
        const bValue = b[sortMode.by];

        if (aValue === undefined || bValue === undefined) return 0;
        if (aValue < bValue) return sortMode.type === "asc" ? -1 : 1;
        if (aValue > bValue) return sortMode.type === "asc" ? 1 : -1;
        return 0;
    });
}

const InstallingApkDialog = ({ files, adb, onDone, config }: { files: File[], adb: Adb, onDone: () => void, config: TConfig }) => {
    const { t } = useTranslation();
    const [log, setLog] = useState<string[]>([]);
    const [installed, setInstalled] = useState({
        installed: 0,
        failed: 0,
    });

    useEffect(() => {
        const pm = new PackageManager(adb);
        (async () => {
            let installedCount = 0, failedCount = 0;
            for (const file of files) {
                try {
                    //@ts-expect-error broken type
                    await pm.installStream(file.size, file.stream(), {
                        ...(config.install_apk.useOptions ? config.install_apk.options : {}),
                        apex: file.name.toLocaleLowerCase().endsWith(".apex"),
                    });
                    setInstalled((prev) => ({ ...prev, installed: prev.installed + 1, failed: prev.failed }));
                    installedCount++;
                } catch (e) {
                    console.error(e);
                    setLog((prev) => [...prev,
                    `${file.name}: ${(e instanceof Error ? e.message : "Unknown error")}`
                    ]);
                    setInstalled((prev) => ({ ...prev, failed: prev.failed + 1 }));
                    failedCount++;
                }
            }
            if (installedCount === files.length) {
                toast.success(t("installing_files_success"));
            } else {
                toast.warning(t("installing_files_partially_failed", { installed: installedCount, failed: failedCount }));
            }
        })();
    }, []);

    return (
        <>
            <Text size="2">{t("installing_files", { installed: installed.installed, total: files.length, failed: installed.failed })}</Text>
            <Progress mt="2" value={installed.installed / files.length * 100} />
            {installed.failed > 0 &&
                <Text asChild size="1" mt="2" style={{
                    background: 'rgba(128,128,128,0.3)',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    overflow: 'auto',
                    maxHeight: '200px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                }}>
                    <pre>{log.join("\n")}</pre>
                </Text>
            }

            {installed.installed + installed.failed === files.length && (
                <Button variant="soft" style={{ width: '100%' }} onClick={onDone} mt="2">{t("close")}</Button>
            )}
        </>
    )
}

export default function ToolsAppManager({ adb, config }: { adb: Adb, config: TConfig }) {
    const { t } = useTranslation();
    const dialog = useDialog();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [tabValue, setTabValue] = useState("all");
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [realSearch, setRealSearch] = useState("");
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);
    const [sortMode, setSortMode] = useState<{
        by: "packageName" | "versionCode" | "uid";
        type: "asc" | "desc";
    }>({
        by: "packageName",
        type: "asc",
    });
    const [listPackages, setListPackages] = useState<PackageManagerListPackagesResult[]>([]);
    const [selectedPackages, setSelectedPackages] = useState<PackageManagerListPackagesResult[]>([]);

    const handleGetPackages = useCallback(async () => {
        setIsLoading(true);
        try {
            const pm = new PackageManager(adb);
            const packages = pm.listPackages({
                listDisabled: tabValue === "disabled",
                listEnabled: tabValue === "enabled",
                listSystem: tabValue === "system",
                listThirdParty: tabValue === "third_party",
                listApexOnly: tabValue === "apex",
                showUid: true,
                showVersionCode: true,
            });

            const lsPkg: PackageManagerListPackagesResult[] = [];

            for await (const pkg of packages) {
                lsPkg.push(pkg);
            }

            setListPackages(lsPkg);
            setSelectedPackages([]);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [tabValue]);

    const sortedPackages = useMemo(
        () =>
            sortPackages(listPackages, sortMode).filter((pkg) =>
                pkg.packageName.toLowerCase().includes(realSearch.toLowerCase()),
            ),
        [listPackages, sortMode, realSearch],
    );

    const handleInstallApkFromFile = useCallback(async () => {
        const fileInput = fileInputRef.current;
        if (!fileInput) return;
        fileInput.multiple = true;
        fileInput.accept = ".apk, .apex, .zip";
        fileInput.click();
    }, []);

    const handleActionSelected = useCallback(async (action: "uninstall" | "disable" | "enable", user: "all" | "current" | "specific") => {
        if (selectedPackages.length === 0) return;
        dialog.confirm(
            t('confirm_selected_packages_' + action + '_title'),
            t('confirm_selected_packages_' + action + '_description', { count: selectedPackages.length }),
            async () => {
                let userID: SingleUserOrAll = "all";
                switch (user) {
                    case "all":
                        userID = "all";
                        break;
                    case "current":
                        userID = "current";
                        break;
                    case "specific": {
                        const getUid = (await (async () => new Promise<number | false>((res) => {
                            dialog.prompt(
                                t("specific_user_id"),
                                t("specific_user_id_description"),
                                [{
                                    label: t("specific_user_id_label"),
                                    placeholder: "0",
                                    defaultValue: "0",
                                    inputProps: {
                                        type: "number",
                                    },
                                    validate: (value) => {
                                        return !isNaN(Number(value));
                                    }
                                }],
                                (value, close) => {
                                    res(Number(value[0]));
                                    close();
                                },
                                () => res(false)
                            );
                        }))());
                        if (getUid === false) {
                            toast.error(t("cancelled"));
                            return;
                        };
                        userID = getUid;
                        break;
                    }
                }

                setIsLoading(true);
                const pm = new PackageManager(adb);
                try {
                    for (const pkg of selectedPackages) {
                        switch (action) {
                            case "uninstall":
                                await pm.uninstall(pkg.packageName, {
                                    user: userID,
                                });
                                break;
                            case "disable":
                                if (userID === "all") {
                                    await runAdbCmd(adb, `pm disable ${pkg.packageName}`);
                                } else if (userID === "current") {
                                    await runAdbCmd(adb, `pm disable-user ${pkg.packageName}`);
                                } else {
                                    await runAdbCmd(adb, `pm disable-user --user ${userID} ${pkg.packageName}`);
                                }
                                break;
                            case "enable":
                                if (userID === "all") {
                                    await runAdbCmd(adb, `pm enable ${pkg.packageName}`);
                                } else if (userID === "current") {
                                    await runAdbCmd(adb, `pm enable-user ${pkg.packageName}`);
                                } else {
                                    await runAdbCmd(adb, `pm enable-user --user ${userID} ${pkg.packageName}`);
                                }
                                break;
                            default:
                                break;
                        }
                    }
                    toast.success(t(`${action}_selected_packages_success`));
                    handleGetPackages();
                } catch (e) {
                    console.error(e);
                    toast.error(t(`error_while_performing_${action}_selected_packages`));
                } finally {
                    setIsLoading(false);
                }
            }
        );
    }, [selectedPackages, handleGetPackages, adb, t, dialog]);

    useEffect(() => {
        const handleChange = (e: Event) => {
            const files = (e.target as HTMLInputElement).files;
            if (!files) return;
            dialog.confirm(
                t("install_apk_from_file"),
                t("install_apk_from_file_description"),
                () => {
                    dialog.show({
                        type: DialogType.Alert,
                        title: t("installing_apk"),
                        content: <InstallingApkDialog files={Array.from(files)} adb={adb} onDone={() => {
                            dialog.close();
                            handleGetPackages();
                        }}
                            config={config}
                        />,
                        buttons: () => <></>,
                    });
                },
                () => {
                    if (fileInputRef.current) {
                        fileInputRef.current.files = null;
                        fileInputRef.current.value = "";
                    }
                }
            )
        }

        if (fileInputRef.current) {
            fileInputRef.current.addEventListener("change", handleChange);
        }
        return () => {
            if (fileInputRef.current) {
                fileInputRef.current.removeEventListener("change", handleChange);
            }
        }
    }, [adb, handleGetPackages, dialog, t, config]);

    useEffect(() => {
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }
        searchTimeout.current = setTimeout(() => {
            setRealSearch(search);
        }, 500);
    }, [search]);

    useEffect(() => {
        handleGetPackages();
    }, [handleGetPackages]);

    return (
        <div className={cls.pm}>
            <input
                type="file"
                ref={fileInputRef}
                multiple
                accept=".apk, .apex, .zip"
                style={{ display: "none" }} />
            <Card size="1" variant="surface" className={cls.pmHeader}>
                <TextField.Root
                    size="1"
                    className={cls.pmSearch}
                    placeholder={t("search")}
                    disabled={isLoading}
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                    }}
                >
                    <TextField.Slot>
                        <MagnifyingGlassIcon />
                    </TextField.Slot>
                </TextField.Root>
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger disabled={isLoading}>
                        <IconButton variant="soft" color={selectedPackages.length > 0 ? "cyan" : "gray"} size="1" disabled={isLoading}>
                            {isLoading ? <Spinner size="2" /> : <HamburgerMenuIcon />}
                        </IconButton>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content variant="soft" size="1">
                        <DropdownMenu.Item onClick={handleGetPackages}>
                            <PiArrowsClockwise size={18} />
                            {t("refresh")}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item onClick={handleInstallApkFromFile}>
                            <PiAndroidLogoDuotone size={18} />
                            {t("install_apk_from_file")}
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator />
                        <DropdownMenu.Item disabled>
                            {t('selected_count', { count: selectedPackages.length })}
                        </DropdownMenu.Item>
                        <DropdownMenu.Sub>
                            <DropdownMenu.SubTrigger disabled={selectedPackages.length === 0}>
                                <PiTrashDuotone size={18} />
                                {t("uninstall")}
                            </DropdownMenu.SubTrigger>
                            <DropdownMenu.SubContent>
                                <DropdownMenu.Item
                                    onClick={() => handleActionSelected("uninstall", "all")}
                                >
                                    {t('all_users')}
                                </DropdownMenu.Item>
                                <DropdownMenu.Item
                                    onClick={() => handleActionSelected("uninstall", "current")}
                                >
                                    {t('current_user')}
                                </DropdownMenu.Item>
                                <DropdownMenu.Item
                                    onClick={() => handleActionSelected("uninstall", "specific")}
                                >
                                    {t('specific_user_id')}
                                </DropdownMenu.Item>
                            </DropdownMenu.SubContent>
                        </DropdownMenu.Sub>
                        <DropdownMenu.Sub>
                            <DropdownMenu.SubTrigger disabled={selectedPackages.length === 0 || tabValue === "disabled"}>
                                <PiLockDuotone size={18} />
                                {t("disable")}
                            </DropdownMenu.SubTrigger>
                            <DropdownMenu.SubContent>
                                <DropdownMenu.Item
                                    onClick={() => handleActionSelected("disable", "all")}
                                >
                                    {t('all_users_need_su')}
                                </DropdownMenu.Item>
                                <DropdownMenu.Item
                                    onClick={() => handleActionSelected("disable", "current")}
                                >
                                    {t('current_user')}
                                </DropdownMenu.Item>
                                <DropdownMenu.Item
                                    onClick={() => handleActionSelected("disable", "specific")}
                                >
                                    {t('specific_user_id')}
                                </DropdownMenu.Item>
                            </DropdownMenu.SubContent>
                        </DropdownMenu.Sub>
                        <DropdownMenu.Sub>
                            <DropdownMenu.SubTrigger disabled={selectedPackages.length === 0 || tabValue === "enabled"}>
                                <PiLockOpenDuotone size={18} />
                                {t("enable")}
                            </DropdownMenu.SubTrigger>
                            <DropdownMenu.SubContent>
                                <DropdownMenu.Item
                                    onClick={() => handleActionSelected("enable", "all")}
                                >
                                    {t('all_users_need_su')}
                                </DropdownMenu.Item>
                                <DropdownMenu.Item
                                    onClick={() => handleActionSelected("enable", "current")}
                                >
                                    {t('current_user')}
                                </DropdownMenu.Item>
                                <DropdownMenu.Item
                                    onClick={() => handleActionSelected("enable", "specific")}
                                >
                                    {t('specific_user_id')}
                                </DropdownMenu.Item>
                            </DropdownMenu.SubContent>
                        </DropdownMenu.Sub>
                    </DropdownMenu.Content>
                </DropdownMenu.Root>
            </Card>
            <Tabs.Root
                defaultValue="all"
                onValueChange={(value) => {
                    setTabValue(value);
                }}
            >
                <Tabs.List size="1">
                    <Tabs.Trigger value="all" disabled={isLoading}>
                        {t("all")}
                    </Tabs.Trigger>
                    <Tabs.Trigger value="enabled" disabled={isLoading}>
                        {t("enabled")}
                    </Tabs.Trigger>
                    <Tabs.Trigger value="disabled" disabled={isLoading}>
                        {t("disabled")}
                    </Tabs.Trigger>
                    <Tabs.Trigger value="system" disabled={isLoading}>
                        {t("system")}
                    </Tabs.Trigger>
                    <Tabs.Trigger value="third_party" disabled={isLoading}>
                        {t("third_party")}
                    </Tabs.Trigger>
                    <Tabs.Trigger value="apex" disabled={isLoading}>
                        {t("apex")}
                    </Tabs.Trigger>
                </Tabs.List>
            </Tabs.Root>
            <Table.Root
                size="1"
                variant="surface"
                className={cls.pmTable}
                layout="fixed"
                style={{ pointerEvents: isLoading ? "none" : "unset" }}
            >
                <Table.Header className={cls.pmTableHeader}>
                    <Table.Row>
                        <Table.ColumnHeaderCell style={{ width: "25px" }}>
                            <Checkbox
                                disabled={isLoading}
                                checked={
                                    listPackages.length > 0 && selectedPackages.length === listPackages.length
                                        ? true
                                        : selectedPackages.length > 0
                                            ? "indeterminate"
                                            : false
                                }
                                onCheckedChange={(checked) => {
                                    if (checked) {
                                        setSelectedPackages(listPackages);
                                    } else {
                                        setSelectedPackages([]);
                                    }
                                }}
                            />
                        </Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell
                            onClick={() =>
                                setSortMode({ by: "packageName", type: sortMode.type === "asc" ? "desc" : "asc" })
                            }
                        >
                            {t("package_name")}
                            {sortMode.by === "packageName" && (
                                <IconButton variant="soft" color="gray" size="1" className={cls.SortButton}>
                                    {sortMode.type === "asc" ? <PiArrowUp size={12} /> : <PiArrowDown size={12} />}
                                </IconButton>
                            )}
                        </Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell
                            onClick={() =>
                                setSortMode({ by: "versionCode", type: sortMode.type === "asc" ? "desc" : "asc" })
                            }
                            style={{ width: "150px", textAlign: "center" }}
                        >
                            {t("version_code")}
                            {sortMode.by === "versionCode" && (
                                <IconButton variant="soft" color="gray" size="1" className={cls.SortButton}>
                                    {sortMode.type === "asc" ? <PiArrowUp size={12} /> : <PiArrowDown size={12} />}
                                </IconButton>
                            )}
                        </Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell
                            onClick={() => setSortMode({ by: "uid", type: sortMode.type === "asc" ? "desc" : "asc" })}
                            style={{ width: "100px", textAlign: "center" }}
                        >
                            {t("uid")}
                            {sortMode.by === "uid" && (
                                <IconButton variant="soft" color="gray" size="1" className={cls.SortButton}>
                                    {sortMode.type === "asc" ? <PiArrowUp size={12} /> : <PiArrowDown size={12} />}
                                </IconButton>
                            )}
                        </Table.ColumnHeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {sortedPackages.map((pkg) => (
                        <Table.Row key={pkg.packageName}>
                            <Table.Cell>
                                <Checkbox
                                    checked={selectedPackages.some((p) => p.packageName === pkg.packageName)}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            setSelectedPackages([...selectedPackages, pkg]);
                                        } else {
                                            setSelectedPackages(
                                                selectedPackages.filter((p) => p.packageName !== pkg.packageName),
                                            );
                                        }
                                    }}
                                />
                            </Table.Cell>
                            <Table.Cell>{pkg.packageName}</Table.Cell>
                            <Table.Cell style={{ textAlign: "center" }}>
                                <Text color="gray" size="1">
                                    {pkg.versionCode}
                                </Text>
                            </Table.Cell>
                            <Table.Cell style={{ textAlign: "center" }}>
                                <Text color="gray" size="1">
                                    {pkg.uid}
                                </Text>
                            </Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table.Root>
        </div>
    );
}
