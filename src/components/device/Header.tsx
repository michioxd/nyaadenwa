/*
 * Copyright (c) 2025 michioxd
 * Released under GNU General Public License 3.0. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import { Badge, Box, Flex, Text, Tooltip } from "@radix-ui/themes";
import type { DumpSys } from "@yume-chan/android-bin";
import { useEffect, useRef, useState } from "react";
import {
    PiAndroidLogoDuotone,
    PiBatteryFullDuotone,
    PiBatteryHighDuotone,
    PiBatteryLowDuotone,
    PiBatteryMediumDuotone,
    PiBatteryWarningDuotone,
    PiPlugChargingDuotone,
    PiUsbDuotone,
} from "react-icons/pi";

export default function DeviceHeader({ dumpSys, close }: { dumpSys: DumpSys; close: () => void }) {
    const [androidVersion, setAndroidVersion] = useState("");
    const [batterStatus, setBatterStatus] = useState<DumpSys.Battery.Info | null>(null);
    const interval = useRef<NodeJS.Timeout | null>(null);

    const getBatterStatus = async () => {
        try {
            const batterStatus = await dumpSys.battery();
            setBatterStatus(batterStatus);
        } catch (error) {
            if (error instanceof Error && error.message.includes("device is not connected")) {
                close();
            }
        }
    };

    useEffect(() => {
        (async () => {
            setAndroidVersion(await dumpSys.adb.getProp("ro.build.version.release"));
            getBatterStatus();
            interval.current = setInterval(getBatterStatus, 1000);
        })();

        return () => {
            if (interval.current) {
                clearInterval(interval.current);
            }
        };
    }, [dumpSys]);
    return (
        <>
            <Flex gap="2" align="center">
                {androidVersion && (
                    <Tooltip content={`Android ${androidVersion}`}>
                        <Badge size="1" color="cyan">
                            <PiAndroidLogoDuotone size={15} />
                            {androidVersion}
                        </Badge>
                    </Tooltip>
                )}
                <Box style={{ flex: 1 }} />
                {batterStatus && batterStatus.level && (
                    <>
                        {batterStatus.level <= 5 ? (
                            <PiBatteryWarningDuotone size={20} />
                        ) : batterStatus.level <= 25 ? (
                            <PiBatteryLowDuotone size={20} />
                        ) : batterStatus.level <= 50 ? (
                            <PiBatteryMediumDuotone size={20} />
                        ) : batterStatus.level <= 75 ? (
                            <PiBatteryHighDuotone size={20} />
                        ) : (
                            <PiBatteryFullDuotone size={20} />
                        )}
                        <Tooltip
                            content={`${batterStatus.level}% ${batterStatus.acPowered ? "AC" : ""} ${batterStatus.usbPowered ? "USB" : ""}`}
                        >
                            <Text
                                size="1"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                {batterStatus.level}%
                                {batterStatus.acPowered ? (
                                    <PiPlugChargingDuotone size={15} />
                                ) : batterStatus.usbPowered ? (
                                    <PiUsbDuotone size={15} />
                                ) : null}
                            </Text>
                        </Tooltip>
                    </>
                )}
            </Flex>
        </>
    );
}
