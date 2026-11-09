import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readWorkflow(relativePath: string) {
    return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

const dockerWorkflow = readWorkflow('.github/workflows/docker.yml')
const releaseWorkflow = readWorkflow('.github/workflows/release.yml')

// 守卫：镜像多架构构建必须走原生 runner + digest merge。
// QEMU 模拟 arm64 会让 Nuxt 打包与 better-sqlite3 编译退化到不可用，并让 build job 触顶超时。
describe('Docker 工作流原生多架构守卫', () => {
    it('主构建路径不再使用 QEMU', () => {
        expect(dockerWorkflow).not.toContain('setup-qemu-action')
        expect(releaseWorkflow).not.toContain('setup-qemu-action')
    })

    it('build matrix 使用原生 arm runner，且不再由单 runner 覆盖双平台', () => {
        expect(dockerWorkflow).toContain('runner: ubuntu-24.04-arm')
        expect(dockerWorkflow).toContain('platforms: ${{ matrix.platform }}')
        expect(dockerWorkflow).not.toContain('platforms: linux/amd64,linux/arm64')
    })

    it('各架构按 digest 推送，merge 只在全部架构成功后组装 manifest', () => {
        expect(dockerWorkflow).toContain('push-by-digest=true')
        expect(dockerWorkflow).toContain('fail-fast: false')
        expect(dockerWorkflow).toMatch(/\n {2}merge:\n(?:.*\n)*? {4}needs: build[ \t]*\n/u)
        expect(dockerWorkflow).toContain('docker buildx imagetools create')
        // 合成后必须回读校验双架构，避免静默单架构 tag
        expect(dockerWorkflow).toContain('docker buildx imagetools inspect')
    })

    it('digest 文件名在 build 与 merge 之间对齐', () => {
        for (const registry of ['dockerhub', 'ghcr', 'acr']) {
            expect(dockerWorkflow).toContain(`${registry}-\${{ matrix.arch }}.digest`)
            expect(dockerWorkflow).toContain(`${registry}-amd64.digest`)
            expect(dockerWorkflow).toContain(`${registry}-arm64.digest`)
        }
    })

    it('各架构使用独立缓存 scope', () => {
        expect(dockerWorkflow).toContain('cache-from: type=gha,scope=${{ matrix.arch }}')
        expect(dockerWorkflow).toContain('cache-to: type=gha,mode=max,scope=${{ matrix.arch }}')
    })

    it('release 工作流不再内联镜像构建，改为按 tag 派发 docker.yml 并传版本号', () => {
        expect(releaseWorkflow).not.toContain('docker/build-push-action')
        expect(releaseWorkflow).toContain('gh workflow run docker.yml --ref "${RELEASE_TAG}" -f version="${VERSION}"')
        // 派发参数必须与 docker.yml 的 workflow_dispatch input 同名
        expect(dockerWorkflow).toMatch(/\n {6}version:\n/u)
    })
})
