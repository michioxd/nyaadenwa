/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import Locales from "@/locales/list";
import { DropdownMenu, Text } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";

export default function LangSelector() {
    const { i18n } = useTranslation();
    return (
        <DropdownMenu.SubContent>
            {Locales.map((lc) => (
                <DropdownMenu.Item
                    key={lc.code}
                    onClick={() => {
                        i18n.changeLanguage(lc.code);
                    }}
                >
                    <Text
                        weight={i18n.language === lc.code ? "bold" : "regular"}
                    >
                        {lc.flag} {lc.name}{" "}
                        {lc.english.length > 0 && `(${lc.english})`}
                    </Text>
                </DropdownMenu.Item>
            ))}
        </DropdownMenu.SubContent>
    );
}
