/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import {
    Box,
    Button,
    Card,
    Checkbox,
    ContextMenu,
    DropdownMenu,
    Flex,
    IconButton,
    Popover,
    Spinner,
    Table,
    Text,
    TextField,
    Tooltip,
} from "@radix-ui/themes";
import { Adb, AdbShellProtocolSpawner, AdbSyncEntry, LinuxFileType } from "@yume-chan/adb";
import cls from "./fm.module.scss";
import {
    PiAndroidLogoDuotone,
    PiArrowDown,
    PiArrowsLeftRightDuotone,
    PiArrowUp,
    PiCopyDuotone,
    PiDotsThreeBold,
    PiDownloadDuotone,
    PiFileDuotone,
    PiFolderDuotone,
    PiFolderPlusDuotone,
    PiHouseDuotone,
    PiLinkBold,
    PiPenDuotone,
    PiTrashSimpleDuotone,
    PiUploadDuotone,
} from "react-icons/pi";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { formatPermissions, formatSize, isValidPath, validateLinuxFileName } from "@/utils/str";
import { getFileIcon, getFileType } from "@/utils/ext";
import clsx from "clsx";
import useDialog from "@/components/dialog/Dialog";
import { PackageManager } from "@yume-chan/android-bin";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import TextEditor from "./fm/editor";

const SortFunc = (
    a: AdbSyncEntry,
    b: AdbSyncEntry,
    sortMode: { by: "name" | "size" | "modified"; order: "asc" | "desc" },
) => {
    if (sortMode.by === "name") {
        return sortMode.order === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    }
    if (sortMode.by === "size") {
        return sortMode.order === "asc"
            ? Number(BigInt(a.size) - BigInt(b.size))
            : Number(BigInt(b.size) - BigInt(a.size));
    }
    if (sortMode.by === "modified") {
        return sortMode.order === "asc"
            ? Number(BigInt(a.mtime) - BigInt(b.mtime))
            : Number(BigInt(b.mtime) - BigInt(a.mtime));
    }
    return 0;
};

const FileManagerItem = memo(
    ({
        file,
        cd,
        selected,
        onSelect,
        onDelete,
        adb,
        currentPath,
        onOpenEditor,
    }: {
        file: AdbSyncEntry;
        cd?: () => void;
        selected?: boolean;
        onSelect?: () => void;
        onDelete?: () => void;
        adb: Adb;
        currentPath: string;
        onOpenEditor?: () => void;
    }) => {
        const { t, i18n } = useTranslation();
        const dialog = useDialog();
        const [isInstalling, setIsInstalling] = useState(false);

        const fileType = useMemo(() => {
            if (file.type === LinuxFileType.Directory || file.type === LinuxFileType.Link) return "folder";
            const fileExt = file.name.split(".").pop()?.toLowerCase();
            return getFileType(fileExt ?? "file");
        }, [file.name, file.type]);

        const FileIcon = useMemo(() => {
            const fileExt = file.name.split(".").pop()?.toLowerCase();
            return getFileIcon(fileExt ?? "");
        }, [file.name, file.type]);

        // Handle install apk to device
        const handleInstallApk = useCallback(async () => {
            dialog.confirm(
                t("install_apk_to_device"),
                t("install_apk_to_device_description", {
                    name: file.name,
                    size: formatSize(Number(file.size)),
                }),
                async () => {
                    try {
                        setIsInstalling(true);
                        const tmpName = "nyaadenwa_tmp_" + Date.now() + ".apk";
                        let res: AdbShellProtocolSpawner.WaitResult<string> | undefined = undefined;
                        res = await adb.subprocess.shellProtocol?.spawnWaitText(
                            'cp -T "' + currentPath + "/" + file.name + '" /data/local/tmp/' + tmpName,
                        );

                        if (res?.exitCode !== 0) {
                            console.error(res?.stderr);
                            toast.error(t("failed_to_install_apk"));
                            return;
                        }

                        const pm = new PackageManager(adb);
                        await pm.install(["/data/local/tmp/" + tmpName]);
                        res = await adb.subprocess.shellProtocol?.spawnWaitText("rm -f /data/local/tmp/" + tmpName);
                        if (res?.exitCode !== 0) {
                            console.error(res?.stderr);
                            toast.error(t("failed_to_install_apk"));
                            return;
                        }

                        toast.success(t("install_apk_to_device_success"));
                    } catch (error) {
                        console.error(error);
                        toast.error(
                            t("failed_to_install_apk", {
                                name: file.name,
                            }),
                        );
                    } finally {
                        setIsInstalling(false);
                    }
                },
            );
        }, [dialog, adb, file.name, t, currentPath]);

        return (
            <ContextMenu.Root>
                <ContextMenu.Trigger>
                    <Table.Row style={{ backgroundColor: selected ? "rgba(40,40,40,0.3)" : "transparent" }}>
                        <Table.RowHeaderCell>
                            <IconButton
                                onClick={() => onSelect?.()}
                                variant={selected ? "solid" : "soft"}
                                style={{ position: "relative" }}
                                color={
                                    file.type === LinuxFileType.Directory || file.type === LinuxFileType.Link
                                        ? "yellow"
                                        : FileIcon.color
                                }
                                size="1"
                            >
                                {isInstalling ? (
                                    <Spinner size="2" />
                                ) : file.type === LinuxFileType.Directory || file.type === LinuxFileType.Link ? (
                                    <>
                                        <PiFolderDuotone size={18} />
                                        {file.type === LinuxFileType.Link && (
                                            <PiLinkBold
                                                style={{ position: "absolute", bottom: "2px", right: "2px" }}
                                                size={11}
                                            />
                                        )}
                                    </>
                                ) : (
                                    <FileIcon.icon size={18} />
                                )}
                            </IconButton>
                        </Table.RowHeaderCell>
                        <Table.Cell
                            onClick={
                                file.type === LinuxFileType.Directory || file.type === LinuxFileType.Link
                                    ? () => cd?.()
                                    : undefined
                            }
                        >
                            <Text
                                size="1"
                                weight="medium"
                                style={{ fontStyle: file.type === LinuxFileType.Link ? "italic" : "normal" }}
                            >
                                {file.name}
                            </Text>
                        </Table.Cell>
                        <Table.Cell
                            data-col-type="size"
                            onClick={
                                file.type === LinuxFileType.Directory || file.type === LinuxFileType.Link
                                    ? () => cd?.()
                                    : undefined
                            }
                        >
                            <Text size="1" weight="medium" color="gray" align="center">
                                {formatSize(Number(file.size))}
                            </Text>
                        </Table.Cell>
                        <Table.Cell
                            data-col-type="permission"
                            onClick={
                                file.type === LinuxFileType.Directory || file.type === LinuxFileType.Link
                                    ? () => cd?.()
                                    : undefined
                            }
                        >
                            <Text size="1" weight="medium" color="gray" align="center">
                                {formatPermissions(file.permission)}
                            </Text>
                        </Table.Cell>
                        <Table.Cell
                            data-col-type="size"
                            onClick={
                                file.type === LinuxFileType.Directory || file.type === LinuxFileType.Link
                                    ? () => cd?.()
                                    : undefined
                            }
                        >
                            <Text size="1" weight="medium" color="gray" align="center">
                                {new Date(Number(file.mtime) * 1000).toLocaleString(i18n.language)}
                            </Text>
                        </Table.Cell>
                    </Table.Row>
                </ContextMenu.Trigger>
                <ContextMenu.Content variant="soft" size="1">
                    {fileType === "android_package" && (
                        <ContextMenu.Item onClick={handleInstallApk} disabled={isInstalling}>
                            <PiAndroidLogoDuotone size={18} />
                            {t(isInstalling ? "installing" : "install_apk_to_device")}
                        </ContextMenu.Item>
                    )}
                    {(fileType === "code" || fileType === "text") && (
                        <ContextMenu.Item onClick={onOpenEditor}>
                            <PiPenDuotone size={18} />
                            {t("edit_this_file")}
                        </ContextMenu.Item>
                    )}
                    {(file.type === LinuxFileType.Directory || file.type === LinuxFileType.Link) && (
                        <ContextMenu.Item onClick={() => cd?.()}>
                            <PiFolderDuotone size={18} />
                            {t("open")}
                        </ContextMenu.Item>
                    )}
                    {file.type === LinuxFileType.File && (
                        <ContextMenu.Item onClick={() => cd?.()}>
                            <PiDownloadDuotone size={18} />
                            {t("download_file")}
                        </ContextMenu.Item>
                    )}
                    <ContextMenu.Item>
                        <PiCopyDuotone size={18} />
                        {t("copy_" + (file.type === LinuxFileType.Directory ? "folder" : "file"))}
                    </ContextMenu.Item>
                    <ContextMenu.Item>
                        <PiArrowsLeftRightDuotone size={18} />
                        {t("move_" + (file.type === LinuxFileType.Directory ? "folder" : "file"))}
                    </ContextMenu.Item>
                    <ContextMenu.Item onClick={() => onDelete?.()} color="red">
                        <PiTrashSimpleDuotone size={18} />
                        {t("delete_" + (file.type === LinuxFileType.Directory ? "folder" : "file"))}
                    </ContextMenu.Item>
                </ContextMenu.Content>
            </ContextMenu.Root>
        );
    },
);

function FileManager({ adb, deviceHash }: { adb: Adb; deviceHash: string }) {
    const fmRef = useRef<HTMLDivElement>(null);
    const dialog = useDialog();
    const [currentPath, setCurrentPath] = useState(() => {
        const path = localStorage.getItem("fm_path_" + deviceHash);
        return isValidPath(path ?? "") ? (path ?? "/") : "/";
    });
    const [goToPath, setGoToPath] = useState("");
    const [listFiles, setListFiles] = useState<AdbSyncEntry[]>([]);
    const [listFolders, setListFolders] = useState<AdbSyncEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [elemSize, setElemSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
    const [selected, setSelected] = useState<string[]>([]);
    const [showEditor, setShowEditor] = useState(false);
    const [editorPath, setEditorPath] = useState<{ path: string | null; name: string }>({
        path: null,
        name: "",
    });
    const { t } = useTranslation();
    const [sortMode, setSortMode] = useState<{
        by: "name" | "size" | "modified";
        order: "asc" | "desc";
    }>({
        by: "name",
        order: "asc",
    });

    const breadcrumbItems = useMemo(() => {
        const items = currentPath.split("/");

        return items
            .map((item, index) => {
                if (item === "") {
                    return null;
                }
                const path = items.slice(0, index + 1).join("/");
                return {
                    label: item,
                    path,
                };
            })
            .filter((item) => item !== null);
    }, [currentPath]);

    const handleListFiles = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await (await adb.sync()).readdir(currentPath);
            const files = res.filter((file) => file.type === LinuxFileType.File);
            const folders = res.filter(
                (file) =>
                    (file.type === LinuxFileType.Directory || file.type === LinuxFileType.Link) &&
                    file.name !== "." &&
                    file.name !== "..",
            );
            setListFiles(files);
            setListFolders(folders);
        } catch (error) {
            console.error(error);
            setListFiles([]);
            setListFolders([]);
            toast.error("Failed to list files");
        } finally {
            setSelected([]);
            setIsLoading(false);
        }
    }, [adb, currentPath]);

    const handleDelete = useCallback(
        async (file: AdbSyncEntry) => {
            dialog.confirm(
                t("delete_" + (file.type === LinuxFileType.Directory ? "folder" : "file")),
                t("delete_" + (file.type === LinuxFileType.Directory ? "folder" : "file") + "_description", {
                    name: file.name,
                    size: formatSize(Number(file.size)),
                }),
                async () => {
                    try {
                        setIsLoading(true);
                        await adb.rm((currentPath === "/" ? "" : currentPath) + "/" + file.name, {
                            recursive: file.type === LinuxFileType.Directory,
                            force: true,
                        });
                        handleListFiles();
                    } catch (error) {
                        console.error(error);
                        toast.error(
                            t("failed_to_delete_" + (file.type === LinuxFileType.Directory ? "folder" : "file"), {
                                name: file.name,
                            }),
                        );
                    } finally {
                        setIsLoading(false);
                    }
                },
            );
        },
        [dialog, adb, currentPath, handleListFiles, t],
    );

    const handleCreateFile = useCallback(
        async (type: "folder" | "file") => {
            dialog.prompt(
                t("create_" + type),
                t("create_" + type + "_description", {
                    currentPath: currentPath === "/" ? "" : currentPath,
                }),
                [
                    {
                        label: t(type + "_name"),
                    },
                ],
                async (val, close) => {
                    const name = val[0].trim();
                    const path = currentPath === "/" ? "" : currentPath;
                    if (!validateLinuxFileName(name)) {
                        toast.error(t("invalid_" + type + "_name"));
                        return;
                    }
                    close();
                    try {
                        setIsLoading(true);
                        const res = await adb.subprocess.shellProtocol?.spawnWaitText(
                            type === "folder"
                                ? 'mkdir -p "' + path + "/" + name + '"'
                                : 'touch "' + path + "/" + name + '"',
                        );
                        if (res?.exitCode !== 0) {
                            console.error(res?.stderr);
                            toast.error(
                                t("failed_to_create_" + type, {
                                    name,
                                }),
                            );
                            setIsLoading(false);
                            return;
                        }
                        handleListFiles();
                    } catch (error) {
                        console.error(error);
                        toast.error(
                            t("failed_to_create_" + type, {
                                name,
                            }),
                        );
                        setIsLoading(false);
                    }
                },
            );
        },
        [adb, currentPath, handleListFiles, t],
    );

    useEffect(() => {
        handleListFiles();
    }, [handleListFiles]);

    useEffect(() => {
        setGoToPath(currentPath);
    }, [currentPath]);

    useEffect(() => {
        localStorage.setItem("fm_path_" + deviceHash, currentPath);
    }, [currentPath, deviceHash]);

    useEffect(() => {
        if (!fmRef.current) return;
        const handleResize = () => {
            if (!fmRef.current) return;
            setElemSize({ w: fmRef.current.clientWidth, h: fmRef.current.clientHeight });
        };
        handleResize();
        const observer = new ResizeObserver(handleResize);
        observer.observe(fmRef.current);
        return () => observer.disconnect();
    }, []);

    const breadcrumbDisplayItems = useMemo(() => {
        return breadcrumbItems.slice(Math.max(0, breadcrumbItems.length - Math.floor(elemSize.w / 150)));
    }, [breadcrumbItems, elemSize.w]);

    return (
        <div className={clsx(cls.FM, showEditor && cls.ShowEditor)}>
            <TextEditor
                adb={adb}
                path={editorPath.path}
                name={editorPath.name}
                onBack={() => {
                    setEditorPath({ path: null, name: "" });
                    setShowEditor(false);
                }}
            />
            <div className={clsx(cls.FileManager, elemSize.w < 600 && cls.HidePermission)} ref={fmRef}>
                <Card size="1" variant="surface" className={cls.FileManagerBreadcrumb}>
                    <IconButton
                        variant="soft"
                        color="gray"
                        size="1"
                        onClick={() =>
                            setCurrentPath(
                                currentPath.split("/").slice(0, -1).join("/") === ""
                                    ? "/"
                                    : currentPath.split("/").slice(0, -1).join("/"),
                            )
                        }
                        disabled={isLoading || currentPath === "/"}
                    >
                        <PiArrowUp size={18} />
                    </IconButton>
                    <IconButton
                        variant="soft"
                        color={currentPath === "/" ? "cyan" : "gray"}
                        size="1"
                        onClick={() => setCurrentPath("/")}
                        disabled={isLoading}
                    >
                        <PiHouseDuotone />
                    </IconButton>
                    {currentPath !== "/" && breadcrumbDisplayItems.length !== breadcrumbItems.length && (
                        <Popover.Root>
                            <Popover.Trigger>
                                <IconButton variant="soft" color="gray" size="1">
                                    <PiDotsThreeBold />
                                </IconButton>
                            </Popover.Trigger>
                            <Popover.Content size="1">
                                <Flex direction="column" gap="1">
                                    {breadcrumbItems.map((item) => (
                                        <Button
                                            key={item.label}
                                            variant="soft"
                                            color={item.path === currentPath ? "cyan" : "gray"}
                                            size="1"
                                            onClick={() => setCurrentPath(item.path)}
                                            disabled={isLoading}
                                        >
                                            {item.label}
                                        </Button>
                                    ))}
                                </Flex>
                            </Popover.Content>
                        </Popover.Root>
                    )}
                    {currentPath !== "/" &&
                        breadcrumbDisplayItems.map(
                            (item, index) =>
                                item && (
                                    <Tooltip key={index} content={item.label}>
                                        <Button
                                            variant="soft"
                                            color={index === breadcrumbDisplayItems.length - 1 ? "cyan" : "gray"}
                                            size="1"
                                            className={cls.FileManagerBreadcrumbItem}
                                            onClick={() => setCurrentPath(item.path)}
                                            disabled={isLoading}
                                        >
                                            <Text size="1" weight="medium" className={cls.TextEllipsis}>
                                                {item.label}
                                            </Text>
                                        </Button>
                                    </Tooltip>
                                ),
                        )}
                    <Popover.Root>
                        <Popover.Trigger>
                            <Box style={{ flex: "1", height: "100%" }}></Box>
                        </Popover.Trigger>
                        <Popover.Content size="1">
                            <Text size="1" mb="1" weight="bold">
                                {t("enter_path_to_go")}
                            </Text>
                            <TextField.Root
                                mb="2"
                                size="1"
                                placeholder={t("path_name")}
                                value={goToPath}
                                onChange={(e) => setGoToPath(e.target.value)}
                            />
                            <Popover.Close>
                                <Button
                                    variant="soft"
                                    disabled={!isValidPath(goToPath) || isLoading || goToPath === currentPath}
                                    color="cyan"
                                    size="1"
                                    onClick={() =>
                                        setCurrentPath(
                                            goToPath === "/" || goToPath === "" ? "/" : goToPath.replace(/\/$/, ""),
                                        )
                                    }
                                >
                                    {t("go")}
                                </Button>
                            </Popover.Close>
                        </Popover.Content>
                    </Popover.Root>
                    {isLoading && (
                        <IconButton variant="soft" color="gray" size="1" disabled>
                            <Spinner size="2" />
                        </IconButton>
                    )}
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger>
                            <IconButton variant="soft" color="gray" size="1" disabled={isLoading}>
                                <HamburgerMenuIcon />
                            </IconButton>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content size="1" variant="soft">
                            <DropdownMenu.Item onClick={() => handleCreateFile("folder")}>
                                <PiFolderPlusDuotone size={18} />
                                {t("create_folder")}
                            </DropdownMenu.Item>
                            <DropdownMenu.Item onClick={() => handleCreateFile("file")}>
                                <PiFileDuotone size={18} />
                                {t("create_file")}
                            </DropdownMenu.Item>
                            <DropdownMenu.Item>
                                <PiUploadDuotone size={18} />
                                {t("upload_file")}
                            </DropdownMenu.Item>
                            <DropdownMenu.Separator />
                            <DropdownMenu.Item disabled>
                                {t("selected_count", { count: selected.length })}
                            </DropdownMenu.Item>
                            <DropdownMenu.Item disabled={selected.length === 0}>
                                <PiCopyDuotone size={18} />
                                {t("copy_selected")}
                            </DropdownMenu.Item>
                            <DropdownMenu.Item disabled={selected.length === 0}>
                                <PiArrowsLeftRightDuotone size={18} />
                                {t("move_selected")}
                            </DropdownMenu.Item>
                            <DropdownMenu.Item disabled={selected.length === 0} color="red">
                                <PiTrashSimpleDuotone size={18} />
                                {t("delete_selected")}
                            </DropdownMenu.Item>
                        </DropdownMenu.Content>
                    </DropdownMenu.Root>
                </Card>
                <Table.Root
                    size="1"
                    variant="surface"
                    className={cls.FileManagerTable}
                    layout="fixed"
                    style={{ pointerEvents: isLoading ? "none" : "unset" }}
                >
                    <Table.Header className={cls.FileManagerHeader}>
                        <Table.Row>
                            <Table.ColumnHeaderCell style={{ width: "35px" }}>
                                <Checkbox
                                    onCheckedChange={(checked) => {
                                        if (checked === true) {
                                            setSelected([
                                                ...listFiles.map((file) => file.name),
                                                ...listFolders.map((folder) => folder.name),
                                            ]);
                                        } else {
                                            setSelected([]);
                                        }
                                    }}
                                    checked={
                                        listFiles.length + listFolders.length <= 0
                                            ? false
                                            : selected.length === listFiles.length + listFolders.length
                                              ? true
                                              : selected.length > 0
                                                ? "indeterminate"
                                                : false
                                    }
                                />
                            </Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell
                                style={{ minWidth: "120px" }}
                                onClick={() =>
                                    setSortMode({
                                        by: "name",
                                        order:
                                            sortMode.by === "name"
                                                ? sortMode.order === "asc"
                                                    ? "desc"
                                                    : "asc"
                                                : "asc",
                                    })
                                }
                            >
                                {t("name")}
                                {sortMode.by === "name" && (
                                    <IconButton variant="soft" color="gray" size="1" className={cls.SortButton}>
                                        {sortMode.order === "asc" ? <PiArrowUp size={12} /> : <PiArrowDown size={12} />}
                                    </IconButton>
                                )}
                            </Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell
                                data-col-type="size"
                                style={{ width: "120px" }}
                                onClick={() =>
                                    setSortMode({
                                        by: "size",
                                        order:
                                            sortMode.by === "size"
                                                ? sortMode.order === "asc"
                                                    ? "desc"
                                                    : "asc"
                                                : "asc",
                                    })
                                }
                            >
                                {t("size")}
                                {sortMode.by === "size" && (
                                    <IconButton variant="soft" color="gray" size="1" className={cls.SortButton}>
                                        {sortMode.order === "asc" ? <PiArrowUp size={12} /> : <PiArrowDown size={12} />}
                                    </IconButton>
                                )}
                            </Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell data-col-type="permission" style={{ width: "100px" }}>
                                {t("permission")}
                            </Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell
                                data-col-type="modified"
                                style={{ width: "170px" }}
                                onClick={() =>
                                    setSortMode({
                                        by: "modified",
                                        order:
                                            sortMode.by === "modified"
                                                ? sortMode.order === "asc"
                                                    ? "desc"
                                                    : "asc"
                                                : "asc",
                                    })
                                }
                            >
                                {t("modified")}
                                {sortMode.by === "modified" && (
                                    <IconButton variant="soft" color="gray" size="1" className={cls.SortButton}>
                                        {sortMode.order === "asc" ? <PiArrowUp size={12} /> : <PiArrowDown size={12} />}
                                    </IconButton>
                                )}
                            </Table.ColumnHeaderCell>
                        </Table.Row>
                    </Table.Header>

                    <Table.Body>
                        {listFolders
                            .sort((a, b) => SortFunc(a, b, sortMode))
                            .map((file) => (
                                <FileManagerItem
                                    key={file.name}
                                    file={file}
                                    adb={adb}
                                    currentPath={currentPath === "/" ? "" : currentPath}
                                    cd={() =>
                                        setCurrentPath((currentPath === "/" ? "" : currentPath) + "/" + file.name)
                                    }
                                    selected={selected.includes(file.name)}
                                    onDelete={() => handleDelete(file)}
                                    onSelect={() =>
                                        setSelected(
                                            selected.includes(file.name)
                                                ? selected.filter((name) => name !== file.name)
                                                : [...selected, file.name],
                                        )
                                    }
                                />
                            ))}
                        {listFiles
                            .sort((a, b) => SortFunc(a, b, sortMode))
                            .map((file) => (
                                <FileManagerItem
                                    key={file.name}
                                    file={file}
                                    selected={selected.includes(file.name)}
                                    adb={adb}
                                    currentPath={currentPath === "/" ? "" : currentPath}
                                    onOpenEditor={() => {
                                        setEditorPath({
                                            path: (currentPath === "/" ? "" : currentPath) + "/" + file.name,
                                            name: file.name,
                                        });
                                        setShowEditor(true);
                                    }}
                                    onDelete={() => handleDelete(file)}
                                    onSelect={() =>
                                        setSelected(
                                            selected.includes(file.name)
                                                ? selected.filter((name) => name !== file.name)
                                                : [...selected, file.name],
                                        )
                                    }
                                />
                            ))}
                    </Table.Body>
                </Table.Root>
            </div>
        </div>
    );
}

export default memo(FileManager);
