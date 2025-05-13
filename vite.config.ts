/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { ViteMinifyPlugin } from 'vite-plugin-minify';
import viteCompression from "vite-plugin-compression";
// import { VitePWA } from 'vite-plugin-pwa' implement later

let counter = 0;
const nameMap = new Map<string, string>();

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        ViteMinifyPlugin({
            ignoreCustomComments: []
        }),
        viteCompression(),
    ],
    optimizeDeps: {
        exclude: ["@yume-chan/scrcpy-decoder-tinyh264"],
        include: ["@yume-chan/scrcpy-decoder-tinyh264 > yuv-buffer", "@yume-chan/scrcpy-decoder-tinyh264 > yuv-canvas"],
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    css:
        process.env.NODE_ENV === "production"
            ? {
                modules: {
                    generateScopedName: (localName: string, filename: string): string => {
                        const key = `${filename}|${localName}`;
                        return (
                            nameMap.get(key) ??
                            nameMap
                                .set(
                                    key,
                                    (() => {
                                        let name = "",
                                            n = counter++;
                                        do {
                                            name = [..."abcdefghijklmnopqrstuvwxyz"][n % 26] + name;
                                            n = Math.floor(n / 26) - 1;
                                        } while (n >= 0);
                                        return name;
                                    })(),
                                )
                                .get(key)!
                        );
                    },
                },
            }
            : {},
    build: {
        target: ["es2022"],
        minify: "terser",
        terserOptions: {
            parse: {
                html5_comments: false,
            },
            format: {
                comments: false,
            },
        },
        sourcemap: true,
        rollupOptions: {
            output: {
                sourcemapExcludeSources: true,
            },
        },
    },
});
