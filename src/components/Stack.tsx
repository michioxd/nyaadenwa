/*
 * Copyright (c) 2025 michioxd
 * Released under GNU General Public License 3.0. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import cls from "@/scss/Main.module.scss";
import { IconButton, Text } from "@radix-ui/themes";
import { DividerHorizontalIcon, PlusIcon } from "@radix-ui/react-icons";

export default function StackControls({
    stackNum,
    setStackNum,
    index,
}: {
    stackNum: number;
    setStackNum: Dispatch<SetStateAction<number>>;
    index: number;
}) {
    const [currentWindowWidth, setCurrentWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => {
            setCurrentWindowWidth(window.innerWidth);
        };

        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return (
        <>
            {currentWindowWidth > 600 && (
                <div className={cls.StackController}>
                    <IconButton
                        variant="soft"
                        size="1"
                        onClick={() => setStackNum(stackNum - 1)}
                        disabled={stackNum === 0}
                        color="gray"
                    >
                        <DividerHorizontalIcon />
                    </IconButton>
                    <Text>{index + 1}</Text>
                    <IconButton
                        variant="soft"
                        size="1"
                        disabled={currentWindowWidth / (stackNum + 1) <= 700}
                        onClick={() => setStackNum(stackNum + 1)}
                        color="gray"
                    >
                        <PlusIcon />
                    </IconButton>
                </div>
            )}
        </>
    );
}
