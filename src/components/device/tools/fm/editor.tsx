/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import Editor from "@monaco-editor/react";
import { Adb, encodeUtf8 } from "@yume-chan/adb";
import cls from "@/components/device/tools/fm.module.scss";
import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Card, DropdownMenu, Flex, IconButton, Spinner, Text, Tooltip } from "@radix-ui/themes";
import { ArrowLeftIcon } from "@radix-ui/react-icons";
import { ReadableStream, WritableStream } from "@yume-chan/stream-extra";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { PiFloppyDiskDuotone, PiPenDuotone } from "react-icons/pi";
import { editorFileLanguage, getFileLanguage } from "@/utils/ext";
import { editor } from "monaco-editor";

const fontBase = "IntelOne Mono, monospace, Consolas, Courier New, sans-serif";

export default function TextEditor({
    adb,
    path,
    name,
    onBack,
}: {
    adb: Adb;
    path: string | null;
    name: string;
    onBack: () => void;
}) {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const [content, setContent] = useState("");
    const [loaded, setLoaded] = useState(false);
    const [saving, setSaving] = useState(false);
    const [fileLanguage, setFileLanguage] = useState<string>("plaintext");
    const { t } = useTranslation();

    useEffect(() => {
        setFileLanguage(getFileLanguage(name));
    }, [name]);

    const handleLoadFile = useCallback(async () => {
        if (!path) {
            return;
        }
        setLoaded(false);
        setContent("");
        try {
            const content = (await adb.sync()).read(path);
            let dataChunk: Uint8Array = new Uint8Array();

            await content.pipeTo(
                new WritableStream({
                    write(chunk) {
                        dataChunk = chunk;
                    },
                }),
            );

            const text = new TextDecoder().decode(dataChunk);
            setContent(text);
            setLoaded(true);
        } catch (e) {
            console.error(e);
            toast.error(t("failed_to_load_file"));
        }
    }, [path]);

    const handleSaveFile = useCallback(async () => {
        if (!path) {
            return;
        }
        setSaving(true);
        try {
            const file = new ReadableStream<Uint8Array>({
                start(controller) {
                    controller.enqueue(encodeUtf8(content));
                    controller.close();
                },
            });

            await (
                await adb.sync()
            ).write({
                filename: path,
                file,
            });
        } catch (e) {
            console.error(e);
            toast.error(t("failed_to_save_file"));
        } finally {
            setSaving(false);
        }
    }, [path, content]);

    useEffect(() => {
        handleLoadFile();
    }, [handleLoadFile]);

    return (
        <div className={cls.TextEditor}>
            <Card size="1" variant="surface" className={cls.Header}>
                <IconButton
                    size="2"
                    variant="soft"
                    color="gray"
                    onClick={() => {
                        setTimeout(() => {
                            setLoaded(false);
                            setContent("");
                        }, 200);
                        onBack();
                    }}
                >
                    <ArrowLeftIcon />
                </IconButton>
                <Flex direction="column">
                    <Text size="2" style={{ fontFamily: fontBase, fontSize: "12px", lineHeight: 1 }}>
                        {name}
                    </Text>
                    <Text size="1" color="gray" style={{ fontFamily: fontBase, fontSize: "10px", lineHeight: 1 }}>
                        {path}
                    </Text>
                </Flex>
                <Box style={{ flex: 1 }} />
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                        <IconButton size="2" variant="soft" color="gray">
                            <Tooltip content={t("select_editor_language", {
                                current: fileLanguage,
                            })}>
                                <PiPenDuotone size={20} />
                            </Tooltip>
                        </IconButton>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content size="1" variant="soft">
                        <DropdownMenu.Item disabled>
                            {t("selected_language", {
                                current: fileLanguage,
                            })}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item key="plaintext" onClick={() => setFileLanguage("plaintext")}>
                            <Text size="1" weight={fileLanguage === "plaintext" ? "bold" : "regular"}>
                                plaintext
                            </Text>
                        </DropdownMenu.Item>
                        {Object.entries(editorFileLanguage).map(([key]) => (
                            <DropdownMenu.Item key={key} onClick={() => setFileLanguage(key)}>
                                <Text size="1" weight={key === fileLanguage ? "bold" : "regular"}>
                                    {key}
                                </Text>
                            </DropdownMenu.Item>
                        ))}
                    </DropdownMenu.Content>
                </DropdownMenu.Root>
                <Tooltip content={t("save_file")}>
                    <IconButton
                        size="2"
                        variant="soft"
                        disabled={saving || !loaded}
                        color="gray"
                        onClick={() => {
                            handleSaveFile();
                        }}
                    >
                        {saving ? <Spinner size="2" /> : <PiFloppyDiskDuotone size={20} />}
                    </IconButton>
                </Tooltip>
            </Card>
            {loaded ? (
                <div className={cls.EditorContainer}>
                    <Editor
                        className={cls.Editor}
                        defaultValue=""
                        value={content}
                        language={fileLanguage}
                        loading={
                            <div className={cls.EditorLoading}>
                                <Card className={cls.Container}>
                                    <Spinner />
                                    <Text size="1" color="gray">
                                        Loading editor...
                                    </Text>
                                </Card>
                            </div>
                        }
                        theme="vs-dark"
                        onMount={(editor) => {
                            editorRef.current = editor;
                        }}
                        options={{
                            fontFamily: fontBase,
                            fontSize: 12,
                            minimap: {
                                enabled: false,
                            },
                            wordWrap: "on",
                            folding: false,
                        }}
                        onChange={(c) => {
                            setContent(c ?? "");
                        }}
                    />
                </div>
            ) : (
                <div className={cls.EditorLoading}>
                    <Card className={cls.Container}>
                        <Spinner />
                        <Text size="1" color="gray">
                            Loading...
                        </Text>
                    </Card>
                </div>
            )}
        </div>
    );
}
