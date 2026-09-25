import { defineConfig } from 'tsdown'

export default defineConfig({
    platform: 'node',
    // index.ts 为无副作用库入口；cli.ts 为 stdio CLI 入口（bin.momei-mcp）
    entry: ['src/index.ts', 'src/cli.ts'],
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
