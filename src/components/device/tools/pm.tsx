/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import { Card, Checkbox, DropdownMenu, IconButton, Spinner, Table, Tabs, Text, TextField } from "@radix-ui/themes";
import cls from "./pm.module.scss";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PackageManager, PackageManagerListPackagesResult } from "@yume-chan/android-bin";
import { Adb } from "@yume-chan/adb";
import { useTranslation } from "react-i18next";
import { HamburgerMenuIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { PiAndroidLogoDuotone, PiArrowDown, PiArrowsClockwise, PiArrowUp } from "react-icons/pi";

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

export default function ToolsAppManager({ adb }: { adb: Adb }) {
    const { t } = useTranslation();
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
                        <IconButton variant="soft" color="gray" size="1" disabled={isLoading}>
                            {isLoading ? <Spinner size="2" /> : <HamburgerMenuIcon />}
                        </IconButton>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content variant="soft" size="1">
                        <DropdownMenu.Item onClick={handleGetPackages}>
                            <PiArrowsClockwise size={18} />
                            {t("refresh")}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item>
                            <PiAndroidLogoDuotone size={18} />
                            {t("install_apk_from_file")}
                        </DropdownMenu.Item>
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
