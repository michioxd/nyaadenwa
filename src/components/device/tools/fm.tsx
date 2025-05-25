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
    Progress,
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
    PiArrowsClockwiseDuotone,
    PiArrowsLeftRightDuotone,
    PiArrowUp,
    PiClipboardDuotone,
    PiCopyDuotone,
    PiDotsThreeBold,
    PiDownloadDuotone,
    PiFileDuotone,
    PiFolderDuotone,
    PiFolderPlusDuotone,
    PiHouseDuotone,
    PiLinkBold,
    PiPenDuotone,
    PiPenNibDuotone,
    PiTrashSimpleDuotone,
    PiUploadDuotone,
    PiXBold,
} from "react-icons/pi";
import { memo, MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { formatPermissions, formatSize, isValidPath, validateLinuxFileName } from "@/utils/str";
import { getFileIcon, getFileType, getMimeType } from "@/utils/ext";
import clsx from "clsx";
import useDialog from "@/components/dialog/Dialog";
import { PackageManager } from "@yume-chan/android-bin";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import TextEditor from "./fm/editor";
import { ReadableStream, WritableStream } from "@yume-chan/stream-extra";
import { v4 as uuidv4 } from "uuid";
import { TFunction } from "i18next";
import { DialogContextType } from "@/components/dialog/DialogProvider";

// Add type declarations for File System Access API
declare global {
    interface Window {
        showSaveFilePicker(options?: SaveFilePickerOptions): Promise<FileSystemFileHandle>;
    }
}

interface SaveFilePickerOptions {
    suggestedName?: string;
    types?: Array<{
        description: string;
        accept: Record<string, string[]>;
    }>;
}

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

const FileAlreadyExistsAction = ({
    ok,
    res,
    filesLength,
}: {
    ok: () => void;
    res: (value: number) => void;
    filesLength: number;
}) => {
    const [applyToAll, setApplyToAll] = useState(false);
    const { t } = useTranslation();

    return (
        <>
            {filesLength > 1 && (
                <Flex direction="row" gap="2" align="center">
                    <Checkbox
                        checked={applyToAll}
                        onCheckedChange={(c) => setApplyToAll(c === "indeterminate" ? false : c)}
                    />
                    <Text size="1">{t("apply_to_all")}</Text>
                </Flex>
            )}
            <Button
                onClick={() => {
                    res(applyToAll ? 3 : 0);
                    ok?.();
                }}
            >
                {t("skip")}
            </Button>
            <Button
                variant="soft"
                color="yellow"
                onClick={() => {
                    res(applyToAll ? 4 : 1);
                    ok?.();
                }}
            >
                {t("rename")}
            </Button>
            <Button
                variant="soft"
                color="red"
                onClick={() => {
                    res(applyToAll ? 5 : 2);
                    ok?.();
                }}
            >
                {t("overwrite")}
            </Button>
        </>
    );
};

const fileAlreadyExistsConfirm = (
    dialog: DialogContextType["dialog"],
    filesLength: number,
    fileName: string,
    t: TFunction,
) => {
    return new Promise<number>((res) => {
        dialog.confirm(
            t("file_already_exists", { name: fileName }),
            t("file_already_exists_description", { name: fileName }),
            undefined,
            undefined,
            (ok) => <FileAlreadyExistsAction ok={ok} res={res} filesLength={filesLength} />,
        );
    });
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
        sizeColumn,
        onRename,
        onCopy,
        onMove,
    }: {
        file: AdbSyncEntry;
        cd?: () => void;
        selected?: boolean;
        onSelect?: (one?: boolean) => void;
        onDelete?: () => void;
        adb: Adb;
        currentPath: string;
        onOpenEditor?: () => void;
        sizeColumn?: boolean;
        onRename?: () => void;
        onCopy?: () => void;
        onMove?: () => void;
    }) => {
        const { t, i18n } = useTranslation();
        const dialog = useDialog();
        const [isInstalling, setIsInstalling] = useState(false);
        const lastClick = useRef<number>(0);
        const [downloadProgress, setDownloadProgress] = useState<number | null>(null);

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

        const handleDownloadFile = useCallback(async () => {
            if (!window.showSaveFilePicker) {
                toast.warning(t("download_file_not_supported"));
                return;
            }
            if (downloadProgress !== null || fileType === "folder") return;
            const fileSize = Number(file.size);
            let handle: FileSystemFileHandle | null = null;
            try {
                setDownloadProgress(0);
                const res = (await adb.sync()).read(currentPath + "/" + file.name);

                handle = await window.showSaveFilePicker({
                    suggestedName: file.name,
                    types: [
                        {
                            description: t("file"),
                            accept: {
                                [getMimeType(file.name)]: [`.${file.name.split(".").pop()}`],
                            },
                        },
                    ],
                });

                const writable = await handle.createWritable();
                let downloaded = 0;
                await res.pipeTo(
                    new WritableStream({
                        write(chunk: Uint8Array) {
                            downloaded += chunk.length;
                            setDownloadProgress(Math.round((downloaded / fileSize) * 100));
                            const u8a = new Uint8Array(chunk);
                            const blob = new Blob([u8a]);
                            return writable.write(blob);
                        },
                        close() {
                            return writable.close();
                        },
                    }),
                );
                toast.success(t("download_file_success"));
            } catch (error: unknown) {
                if (error instanceof Error && error.name === "AbortError") {
                    toast.warning(t("user_cancelled_download"));
                    return;
                }
                console.error(error);
                toast.error(
                    t("failed_to_download_file", {
                        name: file.name,
                    }),
                );
            } finally {
                setDownloadProgress(null);
            }
        }, [dialog, adb, file.name, t, currentPath]);

        const onUserHandle = useCallback(
            (e: MouseEvent<HTMLTableDataCellElement, globalThis.MouseEvent>) => {
                const isDirectory = file.type === LinuxFileType.Directory || file.type === LinuxFileType.Link;
                const isDesktop = window.innerWidth >= 600;

                if (isDesktop) {
                    if (e.detail === 1) {
                        onSelect?.(true);
                        return;
                    }

                    if (e.detail === 2 && Date.now() - lastClick.current < 300) {
                        if (isDirectory) {
                            cd?.();
                            return;
                        }
                        if (fileType === "code" || fileType === "text") {
                            onOpenEditor?.();
                            return;
                        }
                        if (fileType === "android_package") {
                            handleInstallApk();
                            return;
                        }

                        handleDownloadFile();
                    } else {
                        lastClick.current = Date.now();
                    }
                    return;
                }

                if (isDirectory) cd?.();
                else if (fileType === "code" || fileType === "text") onOpenEditor?.();
                else if (fileType === "android_package") handleInstallApk();
                else handleDownloadFile();
            },
            [file.type, cd, selected, onSelect, fileType, onOpenEditor, handleDownloadFile, handleInstallApk],
        );

        return (
            <ContextMenu.Root onOpenChange={() => onSelect?.(true)}>
                <ContextMenu.Trigger>
                    <Table.Row
                        className={clsx(cls.FileManagerItem, selected && cls.Selected)}
                        style={
                            downloadProgress
                                ? ({ "--download-progress": `${downloadProgress}%` } as React.CSSProperties)
                                : {}
                        }
                    >
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
                        <Table.Cell onDoubleClick={onUserHandle} onClick={onUserHandle}>
                            <Text
                                size="1"
                                weight="medium"
                                style={{ fontStyle: file.type === LinuxFileType.Link ? "italic" : "normal" }}
                            >
                                {file.name}
                            </Text>
                        </Table.Cell>
                        {sizeColumn && (
                            <Table.Cell data-col-type="size" onDoubleClick={onUserHandle} onClick={onUserHandle}>
                                <Text size="1" weight="medium" color="gray" align="center">
                                    {file.type === LinuxFileType.File ? formatSize(Number(file.size)) : ""}
                                </Text>
                            </Table.Cell>
                        )}
                        <Table.Cell data-col-type="permission" onDoubleClick={onUserHandle} onClick={onUserHandle}>
                            <Text size="1" weight="medium" color="gray" align="center">
                                {formatPermissions(file.permission)}
                            </Text>
                        </Table.Cell>
                        <Table.Cell data-col-type="size" onDoubleClick={onUserHandle} onClick={onUserHandle}>
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
                        <ContextMenu.Item onClick={handleDownloadFile} disabled={downloadProgress !== null}>
                            {downloadProgress !== null ? (
                                <>
                                    <Spinner size="1" />
                                    {t("downloading", {
                                        progress: `${downloadProgress}%`,
                                    })}
                                </>
                            ) : (
                                <>
                                    <PiDownloadDuotone size={18} />
                                    {t("download_file")}
                                </>
                            )}
                        </ContextMenu.Item>
                    )}
                    <ContextMenu.Item onClick={() => onRename?.()}>
                        <PiPenNibDuotone size={18} />
                        {t("rename_" + (file.type === LinuxFileType.Directory ? "folder" : "file"))}
                    </ContextMenu.Item>
                    <ContextMenu.Item onClick={() => onCopy?.()}>
                        <PiCopyDuotone size={18} />
                        {t("copy_" + (file.type === LinuxFileType.Directory ? "folder" : "file"))}
                    </ContextMenu.Item>
                    <ContextMenu.Item onClick={() => onMove?.()}>
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
    const uploadInputRef = useRef<HTMLInputElement>(null);
    const dialog = useDialog();
    const stillUploading = useRef<boolean>(false);
    const [currentPath, setCurrentPath] = useState(() => {
        const path = localStorage.getItem("fm_path_" + deviceHash);
        return isValidPath(path ?? "") ? (path ?? "/") : "/";
    });
    const [goToPath, setGoToPath] = useState("");
    const [listFiles, setListFiles] = useState<AdbSyncEntry[]>([]);
    const [listFolders, setListFolders] = useState<AdbSyncEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [elemSize, setElemSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
    const [selected, setSelected] = useState<AdbSyncEntry[]>([]);
    const [showEditor, setShowEditor] = useState(false);
    const [showUploadArea, setShowUploadArea] = useState(false);
    const [copyTask, setCopyTask] = useState<{
        source: AdbSyncEntry[];
        type: "copy" | "move";
        from: string;
    } | null>(null);
    const [uploadingFiles, setUploadingFiles] = useState<{
        uploaded: number;
        total: number;
        failed: number;
    }>({
        uploaded: 0,
        total: 0,
        failed: 0,
    });
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

    const path = useMemo(() => (currentPath === "/" ? "" : currentPath), [currentPath]);

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
        async (file: AdbSyncEntry | AdbSyncEntry[]) => {
            if (Array.isArray(file)) {
                dialog.confirm(
                    t("delete_selected_items"),
                    t("delete_selected_items_description", {
                        count: file.length,
                    }),
                    async () => {
                        try {
                            setIsLoading(true);
                            for (const f of file) {
                                await adb.rm(path + "/" + f.name, {
                                    recursive: f.type === LinuxFileType.Directory,
                                    force: true,
                                });
                            }
                            handleListFiles();
                        } catch (error) {
                            console.error(error);
                            toast.error(t("failed_to_delete_selected_items"));
                        } finally {
                            setIsLoading(false);
                        }
                    },
                );

                return;
            }
            dialog.confirm(
                t("delete_" + (file.type === LinuxFileType.Directory ? "folder" : "file")),
                t("delete_" + (file.type === LinuxFileType.Directory ? "folder" : "file") + "_description", {
                    name: file.name,
                    size: formatSize(Number(file.size)),
                }),
                async () => {
                    try {
                        setIsLoading(true);
                        await adb.rm(path + "/" + file.name, {
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
                    currentPath: path,
                }),
                [
                    {
                        label: t(type + "_name"),
                        validate: (value) => validateLinuxFileName(value),
                    },
                ],
                async (val, close) => {
                    const name = val[0].trim();
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
        [adb, path, handleListFiles, t],
    );

    const handleRenameFile = useCallback(
        async (file: AdbSyncEntry) => {
            dialog.prompt(
                t("rename_" + (file.type === LinuxFileType.Directory ? "folder" : "file")),
                t("rename_" + (file.type === LinuxFileType.Directory ? "folder" : "file") + "_description", {
                    name: file.name,
                }),
                [
                    {
                        label: t("new_name"),
                        defaultValue: file.name,
                        placeholder: file.name,
                        validate: (value) => validateLinuxFileName(value) && value !== file.name,
                    },
                ],
                async (val, close) => {
                    const name = val[0].trim();
                    if (!validateLinuxFileName(name)) {
                        toast.error(
                            t("invalid_" + (file.type === LinuxFileType.Directory ? "folder" : "file") + "_name"),
                        );
                        return;
                    }
                    if (name === file.name) {
                        toast.error(t("new_name_is_same_as_old_name"));
                        return;
                    }
                    close();
                    try {
                        setIsLoading(true);
                        if (
                            (
                                await adb.subprocess.shellProtocol?.spawnWaitText(
                                    `mv "${path}/${file.name}" "${path}/${name}"`,
                                )
                            )?.exitCode !== 0
                        ) {
                            toast.error(
                                t("failed_to_rename_" + (file.type === LinuxFileType.Directory ? "folder" : "file"), {
                                    name: file.name,
                                }),
                            );
                            setIsLoading(false);
                            return;
                        }
                        handleListFiles();
                    } catch (error) {
                        console.error(error);
                        toast.error(
                            t("failed_to_rename_" + (file.type === LinuxFileType.Directory ? "folder" : "file"), {
                                name: file.name,
                            }),
                        );
                        setIsLoading(false);
                    }
                },
            );
        },
        [dialog, adb, path, t],
    );

    const handleCopyMove = useCallback(async () => {
        if (!copyTask) return;
        setIsLoading(true);
        try {
            for (const file of copyTask.source) {
                await adb.subprocess.shellProtocol?.spawnWaitText(
                    `${copyTask.type === "move" ? "mv" : "cp"} "${copyTask.from}/${file.name}" "${path}/${file.name}"`,
                );
            }
            handleListFiles();
        } catch (error) {
            console.error(error);
            toast.error(t("failed_to_" + copyTask.type + "_selected_files"));
        } finally {
            setIsLoading(false);
        }
    }, [copyTask, path, adb, t, handleListFiles]);

    useEffect(() => {
        handleListFiles();
    }, [handleListFiles]);

    useEffect(() => {
        setGoToPath(path === "" ? "/" : path);
    }, [path]);

    useEffect(() => {
        localStorage.setItem("fm_path_" + deviceHash, path);
    }, [path, deviceHash]);

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

    useEffect(() => {
        if (!uploadInputRef.current) return;
        const handleChange = async (e: Event) => {
            if (!e.target) return;
            if (stillUploading.current) return;
            const files = Array.from((e.target as HTMLInputElement).files ?? []);
            if (files.length === 0) return;
            stillUploading.current = true;
            toast.info(t("uploading_files", {
                count: files.length,
            }))
            setShowUploadArea(false);
            setUploadingFiles({
                uploaded: 0,
                total: (e.target as HTMLInputElement).files?.length ?? 0,
                failed: 0,
            });
            let applyToAllAction = 0;

            for (const file of files) {
                let fileName = file.name;
                try {
                    if (listFiles.find((f) => f.name === fileName)) {
                        let action =
                            applyToAllAction || (await fileAlreadyExistsConfirm(dialog, files.length, file.name, t));

                        if (!applyToAllAction && action > 2) {
                            applyToAllAction = action - 2;
                        }

                        if (applyToAllAction) {
                            action = applyToAllAction - 1;
                        }

                        if (action % 3 === 0) continue;
                        if (action % 3 === 1) {
                            const uuid = uuidv4().substring(0, 8);
                            const parts = fileName.split(".");
                            const ext = parts.length > 1 ? `.${parts.pop()}` : "";
                            fileName = `${parts.join(".")}-${uuid}${ext}`;
                        }
                    }
                    await (
                        await adb.sync()
                    ).write({
                        filename: `${path}/${fileName}`,
                        file: file.stream() as never as ReadableStream<Uint8Array>,
                    });
                    setUploadingFiles((prev) => ({
                        ...prev,
                        uploaded: prev.uploaded + 1,
                    }));
                } catch (error) {
                    console.error(error);
                    toast.error(t("failed_to_upload_file", { name: file.name }));
                    setUploadingFiles((prev) => ({
                        ...prev,
                        failed: prev.failed + 1,
                    }));
                }
            }
            stillUploading.current = false;
            if (uploadInputRef.current) {
                uploadInputRef.current.value = "";
            }
            toast.success(t("upload_files_success"));
            setUploadingFiles({
                uploaded: 0,
                total: 0,
                failed: 0,
            });
            handleListFiles();
        };
        uploadInputRef.current.addEventListener("change", handleChange);
        return () => {
            uploadInputRef.current?.removeEventListener("change", handleChange);
        };
    }, [uploadInputRef.current, adb, path, listFiles, dialog, t]);

    const breadcrumbDisplayItems = useMemo(() => {
        return breadcrumbItems.slice(Math.max(0, breadcrumbItems.length - Math.floor(elemSize.w / 150)));
    }, [breadcrumbItems, elemSize.w]);

    useEffect(() => {
        let timeout: NodeJS.Timeout;
        const handleDrag = (e: DragEvent) => {
            const dt = e.dataTransfer;
            if (dt && dt.types && dt.types.includes("Files")) {
                setShowUploadArea(true);
                clearTimeout(timeout);
            }
        };
        const handleEndDrag = () => {
            timeout = setTimeout(() => {
                setShowUploadArea(false);
            }, 25);
        };
        document.addEventListener("dragover", handleDrag);
        document.addEventListener("dragleave", handleEndDrag);
        return () => {
            document.removeEventListener("dragover", handleDrag);
            document.removeEventListener("dragleave", handleEndDrag);
        };
    }, []);

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
                        color={path === "/" || path === "" ? "cyan" : "gray"}
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
                                            color={item.path === path ? "cyan" : "gray"}
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
                                    disabled={!isValidPath(goToPath) || isLoading || goToPath === path}
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
                    {copyTask && (
                        <Popover.Root>
                            <Popover.Trigger>
                                <IconButton variant="soft" color={copyTask.from !== path ? "cyan" : "gray"} size="1">
                                    <PiClipboardDuotone />
                                </IconButton>
                            </Popover.Trigger>
                            <Popover.Content size="1">
                                <Text size="1">
                                    {t(copyTask.type + "_task_description", {
                                        count: copyTask.source.length,
                                        from: !copyTask.from ? "/" : copyTask.from,
                                    })}
                                </Text>
                                <Button
                                    variant="soft"
                                    mt="1"
                                    disabled={copyTask.from === path}
                                    size="1"
                                    onClick={() => {
                                        handleCopyMove();
                                        setCopyTask(null);
                                    }}
                                >
                                    {copyTask.type === "copy" ? <PiCopyDuotone /> : <PiArrowsLeftRightDuotone />}
                                    {t(copyTask.type + "_to_here")}
                                </Button>
                                <Button size="1" color="red" mt="1" variant="soft" onClick={() => setCopyTask(null)}>
                                    {t("clear_task")}
                                </Button>
                            </Popover.Content>
                        </Popover.Root>
                    )}
                    {uploadingFiles.total > 0 && (
                        <Popover.Root>
                            <Popover.Trigger>
                                <IconButton variant="soft" color="gray" size="1">
                                    <PiUploadDuotone />
                                </IconButton>
                            </Popover.Trigger>
                            <Popover.Content size="1">
                                <Flex direction="column" gap="2">
                                    <Flex direction="row" gap="2" align="center">
                                        <Spinner size="2" />
                                        <Text size="1">
                                            {t("uploading_files", {
                                                uploaded: uploadingFiles.uploaded,
                                                total: uploadingFiles.total,
                                                failed: uploadingFiles.failed,
                                            })}
                                        </Text>
                                    </Flex>
                                    <Progress value={(uploadingFiles.uploaded / uploadingFiles.total) * 100} />
                                </Flex>
                            </Popover.Content>
                        </Popover.Root>
                    )}
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger disabled={isLoading}>
                            <IconButton variant="soft" color="gray" size="1" disabled={isLoading}>
                                <HamburgerMenuIcon />
                            </IconButton>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content size="1" variant="soft">
                            <DropdownMenu.Item onClick={() => handleListFiles()}>
                                <PiArrowsClockwiseDuotone size={18} />
                                {t("refresh")}
                            </DropdownMenu.Item>
                            <DropdownMenu.Item onClick={() => handleCreateFile("folder")}>
                                <PiFolderPlusDuotone size={18} />
                                {t("create_folder")}
                            </DropdownMenu.Item>
                            <DropdownMenu.Item onClick={() => handleCreateFile("file")}>
                                <PiFileDuotone size={18} />
                                {t("create_file")}
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                                onClick={() => uploadInputRef.current?.click()}
                                disabled={uploadingFiles.total > 0}
                            >
                                {uploadingFiles.total > 0 ? <Spinner size="1" /> : <PiUploadDuotone size={18} />}
                                {t("upload_file")}
                            </DropdownMenu.Item>
                            <DropdownMenu.Separator />
                            <DropdownMenu.Item disabled>
                                {t("selected_count", { count: selected.length })}
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                                disabled={selected.length === 0}
                                onClick={() => {
                                    setCopyTask({
                                        type: "copy",
                                        source: selected,
                                        from: path,
                                    });
                                    setSelected([]);
                                }}
                            >
                                <PiCopyDuotone size={18} />
                                {t("copy")}
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                                disabled={selected.length === 0}
                                onClick={() => {
                                    setCopyTask({
                                        type: "move",
                                        source: selected,
                                        from: path,
                                    });
                                    setSelected([]);
                                }}
                            >
                                <PiArrowsLeftRightDuotone size={18} />
                                {t("move")}
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                                disabled={selected.length === 0}
                                color="red"
                                onClick={() => handleDelete(selected)}
                            >
                                <PiTrashSimpleDuotone size={18} />
                                {t("delete")}
                            </DropdownMenu.Item>
                        </DropdownMenu.Content>
                    </DropdownMenu.Root>
                </Card>
                <div className={cls.FmArea}>
                    <div className={clsx(cls.UploadArea, showUploadArea && uploadingFiles.total === 0 && cls.show)}>
                        <Button
                            variant="soft"
                            color="gray"
                            size="2"
                            className={cls.CancelButton}
                            onClick={() => {
                                if (uploadInputRef.current) {
                                    uploadInputRef.current.value = "";
                                }
                                setShowUploadArea(false);
                            }}
                        >
                            <PiXBold size={18} />
                            {t("cancel")}
                        </Button>
                        <input
                            ref={uploadInputRef}
                            type="file"
                            multiple
                            accept="*"
                            className={cls.UploadInput}
                            disabled={uploadingFiles.total > 0}
                        />
                        <div className={cls.Hint}>
                            <PiUploadDuotone size={60} />
                            <Text size="3" weight="bold">
                                {t("drop_files_here_or_click_to_upload")}
                            </Text>
                        </div>
                    </div>
                    <Table.Root
                        size="1"
                        variant="surface"
                        className={cls.FileManagerTable}
                        layout="fixed"
                        style={{ pointerEvents: isLoading ? "none" : "unset" }}
                    >
                        <Table.Header className={cls.FileManagerHeader}>
                            <Table.Row>
                                <Table.ColumnHeaderCell style={{ width: "0px", padding: 0 }}></Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell style={{ width: "35px" }}>
                                    <Checkbox
                                        disabled={isLoading || listFiles.length + listFolders.length <= 0}
                                        onCheckedChange={(checked) => {
                                            if (checked === true) {
                                                setSelected([...listFiles, ...listFolders]);
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
                                            {sortMode.order === "asc" ? (
                                                <PiArrowUp size={12} />
                                            ) : (
                                                <PiArrowDown size={12} />
                                            )}
                                        </IconButton>
                                    )}
                                </Table.ColumnHeaderCell>
                                {listFiles.length > 0 && (
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
                                                {sortMode.order === "asc" ? (
                                                    <PiArrowUp size={12} />
                                                ) : (
                                                    <PiArrowDown size={12} />
                                                )}
                                            </IconButton>
                                        )}
                                    </Table.ColumnHeaderCell>
                                )}
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
                                            {sortMode.order === "asc" ? (
                                                <PiArrowUp size={12} />
                                            ) : (
                                                <PiArrowDown size={12} />
                                            )}
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
                                        sizeColumn={listFiles.length > 0}
                                        currentPath={path}
                                        onCopy={() => {
                                            setCopyTask({
                                                type: "copy",
                                                source: [file],
                                                from: path,
                                            });
                                        }}
                                        onMove={() => {
                                            setCopyTask({
                                                type: "move",
                                                source: [file],
                                                from: path,
                                            });
                                        }}
                                        cd={() => setCurrentPath((path === "/" ? "" : path) + "/" + file.name)}
                                        onRename={() => handleRenameFile(file)}
                                        selected={selected.includes(file)}
                                        onDelete={() => handleDelete(file)}
                                        onSelect={(one) =>
                                            one
                                                ? setSelected([file])
                                                : setSelected(
                                                    selected.includes(file)
                                                        ? selected.filter((name) => name !== file)
                                                        : [...selected, file],
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
                                        selected={selected.includes(file)}
                                        adb={adb}
                                        sizeColumn
                                        currentPath={path}
                                        onCopy={() => {
                                            setCopyTask({
                                                type: "copy",
                                                source: [file],
                                                from: path,
                                            });
                                        }}
                                        onMove={() => {
                                            setCopyTask({
                                                type: "move",
                                                source: [file],
                                                from: path,
                                            });
                                        }}
                                        onOpenEditor={() => {
                                            setEditorPath({
                                                path: path + "/" + file.name,
                                                name: file.name,
                                            });
                                            setShowEditor(true);
                                        }}
                                        onRename={() => handleRenameFile(file)}
                                        onDelete={() => handleDelete(file)}
                                        onSelect={(one) =>
                                            one
                                                ? setSelected([file])
                                                : setSelected(
                                                    selected.includes(file)
                                                        ? selected.filter((name) => name !== file)
                                                        : [...selected, file],
                                                )
                                        }
                                    />
                                ))}
                        </Table.Body>
                    </Table.Root>
                </div>
            </div>
        </div>
    );
}

export default memo(FileManager);
