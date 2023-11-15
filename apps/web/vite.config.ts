import vue from "@vitejs/plugin-vue"
import { defineConfig } from "vite"
import { fileURLToPath } from "url"
import * as path from "path"
import nodePolyfills from "rollup-plugin-polyfill-node"
import nodeResolve from "@rollup/plugin-node-resolve"

export default defineConfig({
    server: { port: 3001 },
    plugins: [
        vue(),
        nodePolyfills(),
        nodeResolve()
    ],
    define: {
        "global": "globalThis"
    },
    resolve: {
        alias: {
            "@": path.resolve(path.dirname(fileURLToPath(import.meta.url)), "src"),
            "./runtimeConfig": "./runtimeConfig.browser"
        },
        extensions: [
            ".js",
            ".json",
            ".jsx",
            ".mjs",
            ".ts",
            ".tsx",
            ".vue",
        ]
    },
    envPrefix: "PUBLIC_"
})