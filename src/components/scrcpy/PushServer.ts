/*
 * Copyright (c) 2025 michioxd
 * Released under GNU General Public License 3.0. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import type { Adb } from "@yume-chan/adb";
import { AdbScrcpyClient } from "@yume-chan/adb-scrcpy";
import { BIN } from "@yume-chan/fetch-scrcpy-server";
import { ReadableStream } from "@yume-chan/stream-extra";

export default async function PushServer(adb: Adb): Promise<boolean> {
    try {
        const bin = await fetch(new URL(BIN.pathname, import.meta.url));
        await AdbScrcpyClient.pushServer(adb, bin.body as never as ReadableStream<Uint8Array>);
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}
