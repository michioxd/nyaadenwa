/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import { createContext, useContext } from "react";
import type { DialogContextType } from "./DialogProvider";

export const DialogContext = createContext<DialogContextType>({
    dialog: {
        alert: () => {},
        confirm: () => {},
        prompt: () => {},
        show: () => {},
        close: () => {},
    },
});

export default function useDialog() {
    const { dialog } = useContext<DialogContextType>(DialogContext);

    return dialog;
}
