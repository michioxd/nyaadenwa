/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import { Adb } from "@yume-chan/adb";

export async function runAdbCmd(adb: Adb, cmd: string) {
    const res = await adb.subprocess.shellProtocol?.spawnWaitText(cmd);
    if (res?.exitCode !== 0) {
        console.error(res?.stderr);
        throw new Error(res?.stderr || "Unknown error");
    }
    return res?.stdout;
}