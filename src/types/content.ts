/*
 * Copyright (c) 2025 michioxd
 * Released under GNU General Public License 3.0. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

export enum ContentTypeProperties {
    Device = "device",
    Settings = "settings",
    About = "about",
}

export interface ContentType {
    uuid?: string;
    id: string;
    title: string;
    type: ContentTypeProperties;
    stackNo: number;
    content: ({ close }: { close: () => void }) => React.ReactNode;
}
