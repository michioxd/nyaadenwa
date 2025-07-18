/*
 * Copyright (c) 2025 michioxd
 * Released under GNU General Public License 3.0. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import { Button, Dialog, Flex, Text, TextField } from "@radix-ui/themes";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DialogContext, DialogType } from "./Dialog";

export interface DialogContextType {
    dialog: {
        alert: (
            title: React.ReactNode,
            content: React.ReactNode,
            onConfirm?: () => void,
            buttons?: DialogCustomButtons,
        ) => void;
        confirm: (
            title: React.ReactNode,
            content: React.ReactNode,
            onConfirm?: () => void,
            onCancel?: () => void,
            buttons?: DialogCustomButtons,
        ) => void;
        prompt: (
            title: React.ReactNode,
            content: React.ReactNode,
            inputs: DialogField[],
            onConfirm?: (value: string[], close: () => void) => void,
            onCancel?: () => void,
            buttons?: DialogCustomButtons,
        ) => void;
        show: (data: DialogData) => void;
        close: () => void;
    };
}

interface DialogField {
    label?: React.ReactNode;
    placeholder?: string;
    defaultValue?: string;
    inputProps?: TextField.RootProps;
    validate?: (value: string) => boolean;
}

type DialogCustomButtons = ((onConfirm: () => void, onCancel: () => void) => React.ReactNode) | null;

type DialogData =
    | {
          type: DialogType.Alert;
          title: React.ReactNode;
          content?: React.ReactNode;
          buttons?: DialogCustomButtons;
          onConfirm?: () => void;
      }
    | {
          type: DialogType.Confirm;
          title: React.ReactNode;
          content?: React.ReactNode;
          buttons?: DialogCustomButtons;
          onConfirm?: () => void;
          onCancel?: () => void;
      }
    | {
          type: DialogType.Prompt;
          title: React.ReactNode;
          content?: React.ReactNode;
          inputs: DialogField[];
          buttons?: DialogCustomButtons;
          onConfirm?: (value: string[], close: () => void) => void;
          onCancel?: () => void;
      };

export default function DialogProvider({ children }: { children: React.ReactNode }) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [data, setData] = useState<DialogData>({
        type: DialogType.Alert,
        title: "",
        content: "",
        onConfirm: () => {},
    });
    const [fieldData, setFieldData] = useState<string[]>([]);

    const dialog = {
        alert: (
            title: React.ReactNode,
            content: React.ReactNode,
            onConfirm?: () => void,
            buttons?: DialogCustomButtons,
        ) => {
            setData({
                type: DialogType.Alert,
                title,
                content,
                onConfirm,
                buttons,
            });
            setOpen(true);
        },
        confirm: (
            title: React.ReactNode,
            content: React.ReactNode,
            onConfirm?: () => void,
            onCancel?: () => void,
            buttons?: DialogCustomButtons,
        ) => {
            setData({
                type: DialogType.Confirm,
                title,
                content,
                onConfirm,
                onCancel,
                buttons,
            });
            setOpen(true);
        },
        prompt: (
            title: React.ReactNode,
            content: React.ReactNode,
            inputs: DialogField[],
            onConfirm?: (value: string[], close: () => void) => void,
            onCancel?: () => void,
            buttons?: DialogCustomButtons,
        ) => {
            setData({
                type: DialogType.Prompt,
                title,
                content,
                inputs,
                onConfirm,
                onCancel,
                buttons,
            });
            setFieldData(inputs.map((input) => input.defaultValue || ""));
            setOpen(true);
        },
        show: (data: DialogData) => {
            setData(data);
            setOpen(true);
        },
        close: () => {
            setOpen(false);
        },
    };

    return (
        <>
            <DialogContext.Provider
                value={{
                    dialog,
                }}
            >
                <Dialog.Root open={open}>
                    <Dialog.Content aria-describedby="dialog-description">
                        <Dialog.Title>{data.title}</Dialog.Title>
                        {data.content && (
                            <Text as="div" size="2" mb="4" id="dialog-description">
                                {data.content}
                            </Text>
                        )}

                        {data.type === DialogType.Prompt && (
                            <Flex direction="column" gap="3">
                                {data.inputs.map((input, index) => (
                                    <label key={index}>
                                        {input.label && (
                                            <Text as="div" size="2" mb="1" weight="bold">
                                                {input.label}
                                            </Text>
                                        )}
                                        <TextField.Root
                                            placeholder={input.placeholder}
                                            value={fieldData[index]}
                                            onChange={(e) => {
                                                setFieldData((prev) => {
                                                    const newData = [...prev];
                                                    newData[index] = e.target.value;
                                                    return newData;
                                                });
                                            }}
                                            {...input.inputProps}
                                        />
                                    </label>
                                ))}
                            </Flex>
                        )}

                        {data.buttons !== undefined ? (
                            data.buttons !== null ? (
                                <Flex gap="3" mt="4" justify="end" align="center">
                                    {data.buttons(
                                        typeof data.onConfirm === "function"
                                            ? () => data.onConfirm?.(fieldData, () => setOpen(false))
                                            : () => {
                                                  setOpen(false);
                                              },
                                        "onCancel" in data && typeof data.onCancel === "function"
                                            ? () => {
                                                  setOpen(false);
                                                  data.onCancel?.();
                                              }
                                            : () => {
                                                  setOpen(false);
                                              },
                                    )}
                                </Flex>
                            ) : (
                                <></>
                            )
                        ) : data.type === DialogType.Alert ? (
                            <Flex gap="3" mt="4" justify="end">
                                <Button
                                    variant="soft"
                                    color="gray"
                                    onClick={() => {
                                        setOpen(false);
                                        if ("onConfirm" in data && typeof data.onConfirm === "function") {
                                            data.onConfirm?.();
                                        }
                                    }}
                                >
                                    {t("ok")}
                                </Button>
                            </Flex>
                        ) : (
                            <Flex gap="3" mt="4" justify="end">
                                <Button
                                    variant="soft"
                                    color="gray"
                                    onClick={() => {
                                        setOpen(false);
                                        if ("onCancel" in data && typeof data.onCancel === "function") {
                                            data.onCancel();
                                        }
                                    }}
                                >
                                    {t("cancel")}
                                </Button>
                                <Button
                                    onClick={() => {
                                        if (data.type === DialogType.Prompt) {
                                            data.onConfirm?.(fieldData, () => setOpen(false));
                                        } else {
                                            setOpen(false);
                                            data.onConfirm?.();
                                        }
                                    }}
                                    disabled={
                                        data.type === DialogType.Prompt &&
                                        data.inputs.some(
                                            (input, index) => input.validate && !input.validate(fieldData[index]),
                                        )
                                    }
                                >
                                    {t("confirm")}
                                </Button>
                            </Flex>
                        )}
                    </Dialog.Content>
                </Dialog.Root>
                {children}
            </DialogContext.Provider>
        </>
    );
}
