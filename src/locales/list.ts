/*
 * Copyright (c) 2025 michioxd
 * Released under GNU General Public License 3.0. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import LocaleEng from "@/locales/lang/en";
import LocaleVie from "@/locales/lang/vi";

export type LocaleResourcesType = {
    [key: string]: {
        [key: string]: string;
    };
};

export const LocalesResources = {
    en: LocaleEng,
    vi: LocaleVie,
};
