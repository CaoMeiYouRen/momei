import { defineConfig } from 'tsdown'

export default defineConfig({
    platform: 'node',
    entry: ['src/index.ts'],
    outDir: 'dist',
    format: ['esm'],
    fixedExtension: true,
    hash: false,
    nodeProtocol: true,
    sourcemap: true,
    clean: true,
    dts: true,
    minify: false,
    shims: true,
})
