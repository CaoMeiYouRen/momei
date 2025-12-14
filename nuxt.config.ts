import { fileURLToPath } from 'node:url'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-12-01',
    devtools: { enabled: true },
    modules: [
        '@nuxt/eslint',
        '@nuxt/test-utils/module',
    ],
    build: {
        // 使用 Babel 转译不兼容的包
        transpile: ['ms', 'debug', (ctx) => !ctx.isDev && 'google-libphonenumber'],
    },
    css: [
        '@/styles/main.scss',
    ],
    eslint: {
        config: {
            standalone: false,
        },
    },
    nitro: {
        prerender: {
            // 为匹配 Cloudflare 路由匹配规则，设置 nitro 选项 autoSubfolderIndex 为 false 。
            autoSubfolderIndex: false,
        },
        // 可选：禁用 unenv 对 debug 的默认适配
        unenv: {
            external: ['debug'],
        },
        esbuild: {
            options: {
                target: 'esnext',
                tsconfigRaw: {
                    compilerOptions: {
                        experimentalDecorators: true,
                    },
                },
            },
        },
        typescript: {
            tsConfig: {
                compilerOptions: {
                    esModuleInterop: true,
                    emitDecoratorMetadata: true,
                    experimentalDecorators: true,
                    strictPropertyInitialization: false,
                },
            },
        },
    },
})
