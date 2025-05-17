/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import { Box, Button, Card, Checkbox, ContextMenu, Flex, IconButton, Popover, Spinner, Table, Text, TextField, Tooltip } from "@radix-ui/themes";
import { Adb, AdbSyncEntry, LinuxFileType } from "@yume-chan/adb";
import cls from "./fm.module.scss";
import { PiArrowDown, PiArrowUp, PiDotsThreeBold, PiFileDuotone, PiFolderDuotone, PiFoldersDuotone, PiHouseDuotone } from "react-icons/pi";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { formatPermissions, formatSize, isValidPath } from "@/utils/str";

const SortFunc = (a: AdbSyncEntry, b: AdbSyncEntry, sortMode: { by: "name" | "size" | "modified", order: "asc" | "desc" }) => {
    if (sortMode.by === "name") {
        return sortMode.order === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    }
    if (sortMode.by === "size") {
        return sortMode.order === "asc" ? Number(BigInt(a.size) - BigInt(b.size)) : Number(BigInt(b.size) - BigInt(a.size));
    }
    if (sortMode.by === "modified") {
        return sortMode.order === "asc" ? Number(BigInt(a.mtime) - BigInt(b.mtime)) : Number(BigInt(b.mtime) - BigInt(a.mtime));
    }
    return 0;
}

const FileManagerItem = ({ file, cd }: { file: AdbSyncEntry, cd?: () => void }) => {
    const { t, i18n } = useTranslation();
    return (

        <ContextMenu.Root>
            <ContextMenu.Trigger>
                <Table.Row onClick={file.type === LinuxFileType.Directory || file.type === LinuxFileType.Link ? () => cd?.() : undefined}>
                    <Table.RowHeaderCell>
                        <IconButton variant="soft" color={file.type === LinuxFileType.Directory ? "yellow" : file.type === LinuxFileType.Link ? "orange" : "gray"} size="1">
                            {file.type === LinuxFileType.Directory
                                ? <PiFolderDuotone size={18} />
                                : file.type === LinuxFileType.Link
                                    ? <PiFoldersDuotone size={18} />
                                    : <PiFileDuotone size={18} />}
                        </IconButton>
                    </Table.RowHeaderCell>
                    <Table.Cell>
                        <Text size="1" weight="medium" style={{ fontStyle: file.type === LinuxFileType.Link ? 'italic' : 'normal' }} >
                            {file.name}
                        </Text>
                    </Table.Cell>
                    <Table.Cell>
                        <Text size="1" weight="medium" color="gray" align="center">
                            {formatSize(Number(file.size))}
                        </Text>
                    </Table.Cell>
                    <Table.Cell>
                        <Text size="1" weight="medium" color="gray" align="center">
                            {formatPermissions(file.permission)}
                        </Text>
                    </Table.Cell>
                    <Table.Cell>
                        <Text size="1" weight="medium" color="gray" align="center">
                            {new Date(Number(file.mtime) * 1000).toLocaleString(i18n.language)}
                        </Text>
                    </Table.Cell>
                </Table.Row>
            </ContextMenu.Trigger>
            <ContextMenu.Content variant="soft" size="1">
                {(file.type === LinuxFileType.Directory || file.type === LinuxFileType.Link) &&
                    <ContextMenu.Item onClick={() => cd?.()}>
                        <PiFolderDuotone />
                        {t("open")}
                    </ContextMenu.Item>
                }
            </ContextMenu.Content>
        </ContextMenu.Root>

    )
}

export default function FileManager({ adb }: { adb: Adb }) {
    const fmRef = useRef<HTMLDivElement>(null);
    const [currentPath, setCurrentPath] = useState("/");
    const [goToPath, setGoToPath] = useState("");
    const [listFiles, setListFiles] = useState<AdbSyncEntry[]>([]);
    const [listFolders, setListFolders] = useState<AdbSyncEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [elemSize, setElemSize] = useState<{ w: number, h: number }>({ w: 0, h: 0 });
    const { t } = useTranslation();
    const [sortMode, setSortMode] = useState<{
        by: "name" | "size" | "modified",
        order: "asc" | "desc"
    }>({
        by: "name",
        order: "asc"
    });

    const breadcrumbItems = useMemo(() => {
        const items = currentPath.split("/");

        return items.map((item, index) => {
            if (item === "") {
                return null;
            }
            const path = items.slice(0, index + 1).join("/");
            return {
                label: item,
                path,
            }
        }).filter((item) => item !== null);
    }, [currentPath]);

    const handleListFiles = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await (await adb.sync()).readdir(currentPath);
            const files = res.filter((file) => file.type === LinuxFileType.File);
            const folders = res.filter((file) => (file.type === LinuxFileType.Directory || file.type === LinuxFileType.Link) && file.name !== "." && file.name !== "..");
            setListFiles(files);
            setListFolders(folders);
        } catch (error) {
            console.error(error);
            setListFiles([]);
            setListFolders([]);
            toast.error("Failed to list files");
        } finally {
            setIsLoading(false);
        }
    }, [adb, currentPath]);

    useEffect(() => {
        handleListFiles();
    }, [handleListFiles]);

    useEffect(() => {
        setGoToPath(currentPath);
    }, [currentPath]);

    useEffect(() => {
        if (!fmRef.current) return;
        const handleResize = () => {
            if (!fmRef.current) return;
            setElemSize({ w: fmRef.current.clientWidth, h: fmRef.current.clientHeight });
        }
        handleResize();
        const observer = new ResizeObserver(handleResize);
        observer.observe(fmRef.current);
        return () => observer.disconnect();
    }, []);

    const breadcrumbDisplayItems = useMemo(() => {
        return breadcrumbItems.slice(
            Math.max(0, breadcrumbItems.length - Math.floor(elemSize.w / 150))
        );
    }, [breadcrumbItems, elemSize.w]);

    console.log(breadcrumbDisplayItems.length, breadcrumbItems.length);

    return (
        <div className={cls.FileManager} ref={fmRef}>
            <Card size="1" variant="surface" className={cls.FileManagerBreadcrumb}>
                <IconButton variant="soft"
                    color="gray" size="1"
                    onClick={() => setCurrentPath(currentPath.split("/").slice(0, -1).join("/"))}
                    disabled={isLoading || currentPath === "/"}>
                    <PiArrowUp size={18} />
                </IconButton>
                <IconButton variant="soft" color={currentPath === "/" ? "cyan" : "gray"} size="1" onClick={() => setCurrentPath("/")} disabled={isLoading}>
                    <PiHouseDuotone />
                </IconButton>
                {(currentPath !== "/" && breadcrumbDisplayItems.length !== breadcrumbItems.length) &&
                    <Popover.Root>
                        <Popover.Trigger>
                            <IconButton variant="soft" color="gray" size="1">
                                <PiDotsThreeBold />
                            </IconButton>
                        </Popover.Trigger>
                        <Popover.Content size="1">
                            <Flex direction="column" gap="1">
                                {breadcrumbItems.map((item) => (
                                    <Button key={item.label}
                                        variant="soft"
                                        color={item.path === currentPath ? "cyan" : "gray"}
                                        size="1"
                                        onClick={() => setCurrentPath(item.path)}
                                        disabled={isLoading}
                                    >{item.label}</Button>
                                ))}
                            </Flex>
                        </Popover.Content>
                    </Popover.Root>
                }
                {currentPath !== "/" && breadcrumbDisplayItems.map((item, index) => item && (
                    <Tooltip content={item.label}>
                        <Button
                            variant="soft"
                            color={index === breadcrumbDisplayItems.length - 1 ? "cyan" : "gray"}
                            size="1"
                            className={cls.FileManagerBreadcrumbItem}
                            key={index}
                            onClick={() => setCurrentPath(item.path)}
                            disabled={isLoading}
                        >
                            <Text size="1" weight="medium" className={cls.TextEllipsis}>
                                {item.label}
                            </Text>
                        </Button>
                    </Tooltip>
                ))}
                <Popover.Root>
                    <Popover.Trigger>
                        <Box style={{ flex: '1', height: '100%' }}></Box>
                    </Popover.Trigger>
                    <Popover.Content size="1">
                        <Text size="1" mb="1" weight="bold">{t('enter_path_to_go')}</Text>
                        <TextField.Root mb="2" size="1" placeholder={t('path_name')} value={goToPath} onChange={(e) => setGoToPath(e.target.value)} />
                        <Popover.Close>
                            <Button variant="soft"
                                disabled={!isValidPath(goToPath) || isLoading || goToPath === currentPath}
                                color="cyan" size="1"
                                onClick={() => setCurrentPath(goToPath === "/" || goToPath === "" ? "/" : goToPath.replace(/\/$/, ''))}
                            >{t('go')}</Button>
                        </Popover.Close>
                    </Popover.Content>
                </Popover.Root>
                {isLoading &&
                    <IconButton variant="soft" color="gray" size="1" disabled>
                        <Spinner size="1" />
                    </IconButton>
                }
            </Card>
            <Table.Root size="1" variant="surface" className={cls.FileManagerTable} layout="fixed" style={{ pointerEvents: isLoading ? 'none' : 'unset' }}>
                <Table.Header className={cls.FileManagerHeader}>
                    <Table.Row>
                        <Table.ColumnHeaderCell style={{ width: "50px" }}>
                            <Checkbox />
                        </Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell
                            style={{ minWidth: "120px" }}
                            onClick={() => setSortMode({ by: "name", order: sortMode.by === "name" ? sortMode.order === "asc" ? "desc" : "asc" : "asc" })}
                        >
                            {t("name")}
                            {sortMode.by === 'name' &&
                                <IconButton variant="soft" color="gray" size="1" className={cls.SortButton}>
                                    {sortMode.order === "asc" ? <PiArrowUp size={12} /> : <PiArrowDown size={12} />}
                                </IconButton>
                            }
                        </Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell style={{ width: "120px" }}
                            onClick={() => setSortMode({ by: "size", order: sortMode.by === "size" ? sortMode.order === "asc" ? "desc" : "asc" : "asc" })}
                        >
                            {t("size")}
                            {sortMode.by === 'size' &&
                                <IconButton variant="soft" color="gray" size="1" className={cls.SortButton}>
                                    {sortMode.order === "asc" ? <PiArrowUp size={12} /> : <PiArrowDown size={12} />}
                                </IconButton>
                            }
                        </Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell style={{ width: "120px" }}>
                            {t("permission")}
                        </Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell style={{ width: "200px" }}
                            onClick={() => setSortMode({ by: "modified", order: sortMode.by === "modified" ? sortMode.order === "asc" ? "desc" : "asc" : "asc" })}
                        >
                            {t("modified")}
                            {sortMode.by === 'modified' &&
                                <IconButton variant="soft" color="gray" size="1" className={cls.SortButton}>
                                    {sortMode.order === "asc" ? <PiArrowUp size={12} /> : <PiArrowDown size={12} />}
                                </IconButton>
                            }
                        </Table.ColumnHeaderCell>
                    </Table.Row>
                </Table.Header>

                <Table.Body>
                    {listFolders.
                        sort((a, b) => SortFunc(a, b, sortMode)).
                        map((file) => (
                            <FileManagerItem key={file.name} file={file} cd={() => setCurrentPath((currentPath === "/" ? "" : currentPath) + "/" + file.name)} />
                        ))}
                    {listFiles.
                        sort((a, b) => SortFunc(a, b, sortMode)).
                        map((file) => (
                            <FileManagerItem key={file.name} file={file} />
                        ))}
                </Table.Body>
            </Table.Root>

        </div>
    )
}