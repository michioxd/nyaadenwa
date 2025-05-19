/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import Editor from '@monaco-editor/react';
import { Adb, encodeUtf8 } from '@yume-chan/adb';
import cls from '@/components/device/tools/fm.module.scss';
import { useCallback, useEffect, useState } from 'react';
import { Box, Card, Flex, IconButton, Spinner, Text, Tooltip } from '@radix-ui/themes';
import { ArrowLeftIcon } from '@radix-ui/react-icons';
import { ReadableStream, WritableStream } from '@yume-chan/stream-extra';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { PiFloppyDiskDuotone } from 'react-icons/pi';
import { getFileLanguage } from '@/utils/ext';

const fontBase = "IntelOne Mono, monospace, Consolas, Courier New, sans-serif";

export default function TextEditor({ adb, path, name, onBack }: { adb: Adb; path: string | null, name: string, onBack: () => void }) {
    const [content, setContent] = useState("");
    const [loaded, setLoaded] = useState(false);
    const [saving, setSaving] = useState(false);
    const { t } = useTranslation();

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

            await (await adb.sync()).write({
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
                <IconButton size="2" variant="soft" color="gray" onClick={() => {
                    setTimeout(() => {
                        setLoaded(false);
                        setContent("");
                    }, 200);
                    onBack();
                }}>
                    <ArrowLeftIcon />
                </IconButton>
                <Flex direction="column">
                    <Text size="2" style={{ fontFamily: fontBase, fontSize: '12px', lineHeight: 1 }}>
                        {name}
                    </Text>
                    <Text size="1" color="gray" style={{ fontFamily: fontBase, fontSize: '10px', lineHeight: 1 }}>
                        {path}
                    </Text>
                </Flex>
                <Box style={{ flex: 1 }} />
                <Tooltip content={t("save_file")}>
                    <IconButton size="2" variant="soft" disabled={saving || !loaded} color="gray" onClick={() => {
                        handleSaveFile();
                    }}>
                        {saving ? <Spinner size="2" /> : <PiFloppyDiskDuotone size={18} />}
                    </IconButton>
                </Tooltip>
            </Card>
            {loaded ?
                <div className={cls.EditorContainer}>
                    <Editor
                        className={cls.Editor}
                        defaultLanguage={getFileLanguage(name)}
                        defaultValue=""
                        value={content}
                        loading={<div className={cls.EditorLoading}>
                            <Card className={cls.Container}>
                                <Spinner />
                                <Text size="1" color="gray">Loading editor...</Text>
                            </Card>
                        </div>}
                        theme='vs-dark'
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
                :
                <div className={cls.EditorLoading}>
                    <Card className={cls.Container}>
                        <Spinner />
                        <Text size="1" color="gray">Loading...</Text>
                    </Card>
                </div>
            }
        </div>
    )
}