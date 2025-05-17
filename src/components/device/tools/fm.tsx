/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import { Box, Button, Card, Checkbox, ContextMenu, IconButton, Spinner, Table, Text, Tooltip } from "@radix-ui/themes";
import { Adb, AdbSyncEntry, LinuxFileType } from "@yume-chan/adb";
import cls from "./fm.module.scss";
import { PiArrowDown, PiArrowUp, PiFileDuotone, PiFolderDuotone, PiFoldersDuotone, PiHouseDuotone } from "react-icons/pi";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { formatPermissions, formatSize } from "@/utils/str";

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
    const { i18n } = useTranslation();
    return (

        <ContextMenu.Root>
            <ContextMenu.Trigger>
                <Table.Row onClick={file.type === LinuxFileType.Directory || file.type === LinuxFileType.Link ? () => cd?.() : undefined}>
                    <Table.RowHeaderCell>
                        <IconButton variant="soft" color="gray" size="1">
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
                        <Text size="1" weight="medium" color="gray">
                            {formatSize(Number(file.size))}
                        </Text>
                    </Table.Cell>
                    <Table.Cell>
                        <Text size="1" weight="medium" color="gray">
                            {formatPermissions(file.permission)}
                        </Text>
                    </Table.Cell>
                    <Table.Cell>
                        <Text size="1" weight="medium" color="gray">
                            {new Date(Number(file.mtime) * 1000).toLocaleString(i18n.language)}
                        </Text>
                    </Table.Cell>
                </Table.Row>
            </ContextMenu.Trigger>
            <ContextMenu.Content variant="soft" size="1">
                <ContextMenu.Item>
                    <PiFolderDuotone />
                    Open
                </ContextMenu.Item>
            </ContextMenu.Content>
        </ContextMenu.Root>

    )
}

export default function FileManager({ adb }: { adb: Adb }) {
    const [currentPath, setCurrentPath] = useState("/");
    const [listFiles, setListFiles] = useState<AdbSyncEntry[]>([]);
    const [listFolders, setListFolders] = useState<AdbSyncEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
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
        });
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

    return (
        <div className={cls.FileManager}>
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
                {currentPath !== "/" && breadcrumbItems.map((item, index) => item && (
                    <Tooltip content={item.label}>
                        <Button
                            variant="soft"
                            color={index === breadcrumbItems.length - 1 ? "cyan" : "gray"}
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
                <Box style={{ flex: '1' }}></Box>
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
                            onClick={() => setSortMode({ by: "name", order: sortMode.by === "name" ? sortMode.order === "asc" ? "desc" : "asc" : "asc" })}
                        >
                            Name
                            {sortMode.by === 'name' &&
                                <IconButton variant="soft" color="gray" size="1" className={cls.SortButton}>
                                    {sortMode.order === "asc" ? <PiArrowUp size={12} /> : <PiArrowDown size={12} />}
                                </IconButton>
                            }
                        </Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell style={{ width: "80px" }}
                            onClick={() => setSortMode({ by: "size", order: sortMode.by === "size" ? sortMode.order === "asc" ? "desc" : "asc" : "asc" })}
                        >
                            Size
                            {sortMode.by === 'size' &&
                                <IconButton variant="soft" color="gray" size="1" className={cls.SortButton}>
                                    {sortMode.order === "asc" ? <PiArrowUp size={12} /> : <PiArrowDown size={12} />}
                                </IconButton>
                            }
                        </Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell style={{ width: "120px" }}>Permission</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell style={{ width: "200px" }}
                            onClick={() => setSortMode({ by: "modified", order: sortMode.by === "modified" ? sortMode.order === "asc" ? "desc" : "asc" : "asc" })}
                        >
                            Modified
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
                            <FileManagerItem key={file.name} file={file} cd={() => setCurrentPath(currentPath + "/" + file.name)} />
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