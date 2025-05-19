/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import { accentColorPropDef } from "@radix-ui/themes/src/props/color.prop.js";
import { IconType } from "react-icons/lib";
import {
    PiAndroidLogoDuotone,
    PiBookDuotone,
    PiFileArchiveDuotone,
    PiFileAudioDuotone,
    PiFileCodeDuotone,
    PiFileDocDuotone,
    PiFileDuotone,
    PiFileImageDuotone,
    PiFilePdfDuotone,
    PiFilePptDuotone,
    PiFileSqlDuotone,
    PiFileTextDuotone,
    PiFileVideoDuotone,
    PiFileXlsDuotone,
    PiFolderDuotone,
    PiGearDuotone,
} from "react-icons/pi";

export const fileExtension = {
    android_package: ["apk"],
    archive: [
        "zip",
        "7z",
        "rar",
        "tar",
        "gz",
        "bz2",
        "xz",
        "deb",
        "rpm",
        "msi",
        "dmg",
        "pkg",
        "cab",
        "iso",
        "jar",
        "arj",
        "lzh",
        "ace",
        "z",
        "sit",
        "sea",
        "cbr",
        "cbz",
    ],
    image: [
        "jpg",
        "jpeg",
        "png",
        "gif",
        "bmp",
        "webp",
        "svg",
        "ico",
        "heic",
        "heif",
        "hevc",
        "tiff",
        "tif",
        "raw",
        "cr2",
        "nef",
        "orf",
        "sr2",
        "psd",
        "ai",
        "eps",
    ],
    video: [
        "mp4",
        "avi",
        "mkv",
        "mov",
        "wmv",
        "flv",
        "webm",
        "m4v",
        "3gp",
        "3g2",
        "mj2",
        "m2ts",
        "mts",
        "m2t",
        "vob",
        "ogv",
        "rm",
        "rmvb",
        "asf",
        "mpg",
        "mpeg"
    ],
    audio: ["mp3", "wav", "aac", "flac", "ogg", "wma", "m4a", "amr", "aiff", "alac", "opus", "mid", "midi", "ra", "au"],
    document: ["doc", "docx", "odt", "rtf", "tex"],
    spreadsheet: ["xls", "xlsx", "ods", "csv", "tsv"],
    presentation: ["ppt", "pptx", "odp", "key"],
    pdf: ["pdf"],
    font: ["ttf", "otf", "woff", "woff2", "eot", "fon"],
    executable: ["exe", "bat", "cmd", "sh", "bin", "run", "app", "msi", "apk", "com", "gadget", "wsf"],
    code: [
        "js",
        "jsx",
        "ts",
        "tsx",
        "py",
        "java",
        "c",
        "cpp",
        "h",
        "cs",
        "rb",
        "php",
        "go",
        "rs",
        "swift",
        "kt",
        "kts",
        "scala",
        "pl",
        "sh",
        "bat",
        "ps1",
        "lua",
        "r",
        "m",
        "vb",
        "dart",
        "sql",
        "html",
        "htm",
        "css",
        "scss",
        "less",
        "xml",
        "json",
        "yml",
        "yaml",
        "ini",
        "toml",
        "cfg",
        "conf",
        "asm",
        "s",
        "v",
        "sv",
        "vhd",
        "vhdl",
        "fs",
        "fsx",
        "fsi",
        "fsscript",
        "jl",
        "groovy",
        "clj",
        "cljs",
        "cljc",
        "edn",
        "coffee",
        "tsv",
        "ipynb",
    ],
    text: [
        "txt",
        "md",
        "rst",
        "log",
        "csv",
        "tsv",
        "json",
        "xml",
        "yaml",
        "yml",
        "ini",
        "conf",
        "cfg",
        "nfo",
        "me",
        "readme",
    ],
    subtitle: ["srt", "sub", "ass", "ssa", "vtt", "sbv", "mpl"],
    database: [
        "db",
        "sql",
        "sqlite",
        "sqlite3",
        "dbf",
        "mdb",
        "accdb",
        "frm",
        "myd",
        "myi",
        "ndf",
        "ldf",
        "sdf",
        "db3",
    ],
    ebook: ["epub", "mobi", "azw", "azw3", "fb2", "lit", "prc", "ibooks"],
    compressed: ["gz", "bz2", "xz", "lz", "lzma", "z", "tar", "tgz", "tbz2", "txz"],
    system: ["sys", "dll", "drv", "cpl", "ocx", "vxd", "efi"],
};

export const fileExtensionIcon: {
    [key in keyof typeof fileExtension | "file" | "folder"]: {
        icon: IconType;
        color: (typeof accentColorPropDef)["color"]["values"][number];
    };
} = {
    android_package: {
        icon: PiAndroidLogoDuotone,
        color: "green",
    },
    archive: {
        icon: PiFileArchiveDuotone,
        color: "gray",
    },
    image: {
        icon: PiFileImageDuotone,
        color: "grass",
    },
    video: {
        icon: PiFileVideoDuotone,
        color: "indigo",
    },
    audio: {
        icon: PiFileAudioDuotone,
        color: "red",
    },
    document: {
        icon: PiFileDocDuotone,
        color: "blue",
    },
    spreadsheet: {
        icon: PiFileXlsDuotone,
        color: "green",
    },
    presentation: {
        icon: PiFilePptDuotone,
        color: "ruby",
    },
    pdf: {
        icon: PiFilePdfDuotone,
        color: "tomato",
    },
    code: {
        icon: PiFileCodeDuotone,
        color: "gray",
    },
    text: {
        icon: PiFileTextDuotone,
        color: "gray",
    },
    subtitle: {
        icon: PiFileTextDuotone,
        color: "gray",
    },
    database: {
        icon: PiFileSqlDuotone,
        color: "gray",
    },
    ebook: {
        icon: PiBookDuotone,
        color: "brown",
    },
    compressed: {
        icon: PiFileArchiveDuotone,
        color: "gray",
    },
    system: {
        icon: PiGearDuotone,
        color: "gray",
    },
    executable: {
        icon: PiGearDuotone,
        color: "gray",
    },
    font: {
        icon: PiFileDuotone,
        color: "gray",
    },
    file: {
        icon: PiFileDuotone,
        color: "gray",
    },
    folder: {
        icon: PiFolderDuotone,
        color: "yellow",
    },
};

const fileLanguage = {
    'javascript': ['js', 'jsx'],
    'typescript': ['ts', 'tsx'],
    'html': ['html', 'htm', 'razor', 'handlebars'],
    'css': ['css', 'scss', 'less'],
    'json': ['json'],
    'yaml': ['yaml', 'yml'],
    'ini': ['ini', 'cfg', 'conf'],
    'sql': ['sql', 'sqlite', 'sqlite3', 'db', 'db3', 'mdb', 'accdb', 'frm', 'myd', 'myi', 'ndf', 'ldf', 'sdf'],
    'python': ['py'],
    'java': ['java'],
    'c': ['c', 'h'],
    'cpp': ['cpp', 'hpp'],
    'ruby': ['rb'],
    'php': ['php'],
    'go': ['go'],
    'rust': ['rs'],
    'swift': ['swift'],
    'kotlin': ['kt', 'kts'],
    'scala': ['scala'],
    'perl': ['pl'],
    'bash': ['sh', 'bash'],
    'powershell': ['ps1'],
    'lua': ['lua'],
    'r': ['r'],
    'v': ['v'],
    'sv': ['sv'],
    'vhd': ['vhd'],
    'vhdl': ['vhdl'],
    'fs': ['fs'],
    'fsx': ['fsx'],
    'fsi': ['fsi'],
    'fsscript': ['fsscript'],
    'groovy': ['groovy'],
    'clojure': ['clj', 'cljs', 'cljc'],
    'edn': ['edn'],
    'coffeescript': ['coffee']
}

export const getFileType = (ext: string): keyof typeof fileExtension | "file" => {
    for (const [key, value] of Object.entries(fileExtension)) {
        if (value.includes(ext)) return key as keyof typeof fileExtension;
    }
    return "file";
};

export const getFileIcon = (
    ext: string,
): {
    icon: IconType;
    color: (typeof accentColorPropDef)["color"]["values"][number];
} => {
    const fileType = getFileType(ext);
    return fileExtensionIcon[fileType];
};

export const getFileLanguage = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (!ext) return "plaintext";
    for (const [key, value] of Object.entries(fileLanguage)) {
        if (value.includes(ext)) return key;
    }
    return "plaintext";
}