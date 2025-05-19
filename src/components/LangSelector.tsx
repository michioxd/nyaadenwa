/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import { DropdownMenu, Flex, Text } from "@radix-ui/themes";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import unknownFlag from "@/assets/unknown_flag.svg";

function getLangInfo(localeCode: string, currentLang: string) {
    const region = new Intl.Locale(localeCode).maximize().region;
    const languageName = new Intl.DisplayNames([localeCode], { type: "language" }).of(localeCode);
    const emoji = region?.toUpperCase().replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + 0x1f1a5));
    const english = new Intl.DisplayNames([currentLang], { type: "language" }).of(localeCode);
    let flag = null;

    try {
        const locale = new Intl.Locale(localeCode).maximize();
        flag = `https://flagcdn.com/${locale.region?.toLowerCase()}.svg`;
    } catch {
        flag = null;
    }

    return { name: languageName, emoji, flag, english };
}

const LangItem = ({ lang }: { lang: string }) => {
    const { i18n } = useTranslation();
    const langInfo = useMemo(() => getLangInfo(lang, i18n.language), [lang, i18n.language]);

    return (
        <DropdownMenu.Item key={lang} onClick={() => i18n.changeLanguage(lang)}>
            <Text weight={i18n.language === lang ? "bold" : "regular"}>
                <Flex gap="1" align="center">
                    {langInfo.flag && (
                        <img
                            style={{ width: 20, height: 13.33333333333333, objectFit: "cover" }}
                            onError={(e) => {
                                e.currentTarget.src = unknownFlag;
                                e.currentTarget.onerror = null;
                            }}
                            src={langInfo.flag}
                            alt={langInfo.name}
                        />
                    )}{" "}
                    {langInfo.name} {lang !== i18n.language && `(${langInfo.english})`}
                </Flex>
            </Text>
        </DropdownMenu.Item>
    );
};

export default function LangSelector() {
    const { i18n } = useTranslation();

    return (
        <DropdownMenu.SubContent>
            {Object.keys(i18n.services.resourceStore.data).map((lc) => (
                <LangItem key={lc} lang={lc} />
            ))}
        </DropdownMenu.SubContent>
    );
}
