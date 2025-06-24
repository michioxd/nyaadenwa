/*
 * Copyright (c) 2025 michioxd
 * Released under GNU General Public License 3.0. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import simpleHeader from "eslint-plugin-simple-header";
import tseslint from "typescript-eslint";

export default tseslint.config(
    { ignores: ["dist"] },
    {
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        files: ["**/*.{ts,tsx}"],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
        },
        plugins: {
            "react-hooks": reactHooks,
            "react-refresh": reactRefresh,
            "simple-header": simpleHeader,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            "@typescript-eslint/no-unused-vars": "warn",
            "@typescript-eslint/no-explicit-any": "off",
            "react-hooks/exhaustive-deps": "off",
            "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
            "simple-header/header": [
                "error",
                {
                    text: [
                        "Copyright (c) {year} {author}",
                        "Released under GNU General Public License 3.0. See LICENSE for more details.",
                        "Repository: https://github.com/michioxd/nyaadenwa",
                    ],
                    templates: { author: [".*", "michioxd"] },
                },
            ],
        },
    },
);
