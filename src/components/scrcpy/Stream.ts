/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import { DefaultServerPath } from "@yume-chan/scrcpy";
import { AdbScrcpyClient, AdbScrcpyOptionsLatest } from "@yume-chan/adb-scrcpy";
import type { Adb } from "@yume-chan/adb";

export default class ScrcpyStream {
    private device: Adb;
    private canvas: HTMLCanvasElement;
    private options: AdbScrcpyOptionsLatest<true>;
    private client: AdbScrcpyClient<AdbScrcpyOptionsLatest>;

    constructor(
        device: Adb,
        canvas: HTMLCanvasElement,
        options: AdbScrcpyOptionsLatest<true>,
    ) {
        this.device = device;
        this.canvas = canvas;
        this.options = options;
    }

    public async start() {
        this.client = await AdbScrcpyClient.start(
            this.device,
            DefaultServerPath,
            new AdbScrcpyOptionsLatest({
                ...this.options,
            }),
        );
    }
}
