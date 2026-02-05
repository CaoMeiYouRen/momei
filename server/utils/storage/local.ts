import fs from 'node:fs/promises'
import path from 'node:path'
import { isServerlessEnvironment } from '../env'
import type { Storage } from './type'

export interface LocalEnv {
    // 本地存储目录
    LOCAL_STORAGE_DIR: string
    // 本地存储基础 URL
    LOCAL_STORAGE_BASE_URL: string
    // 本地存储最小剩余空间 (字节)
    LOCAL_STORAGE_MIN_FREE_SPACE: number
}

/**
 * 本地存储适配器
 */
export class LocalStorage implements Storage {
    private env: LocalEnv

    constructor(env: LocalEnv) {
        this.env = env
    }

    /**
     * 上传文件到本地磁盘
     *
     * @param buffer 文件内容
     * @param filename 文件名 (包含路径前缀)
     * @param contentType 文件类型
     */
    async upload(buffer: Buffer, filename: string, contentType?: string): Promise<{ url: string }> {
        // 1. Serverless 环境冲突检测卫兵
        if (isServerlessEnvironment()) {
            throw createError({
                statusCode: 500,
                statusMessage: '检测到当前处于无服务器 (Serverless) 环境，不支持使用 LocalStorage 适配器。请切换至 S3 或 Vercel Blob 存储方案。',
            })
        }

        // 2. 文件类型校验：仅允许图片上传
        // 首先通过 contentType 检查
        if (contentType && !contentType.startsWith('image/')) {
            throw createError({
                statusCode: 400,
                statusMessage: '安全限制：LocalStorage 模式下仅允许上传图片文件。',
            })
        }

        // 3. 磁盘空间检查 (Disk Space Guard)
        const absoluteBaseDir = path.resolve(process.cwd(), this.env.LOCAL_STORAGE_DIR)

        // 确保基础目录存在
        await fs.mkdir(absoluteBaseDir, { recursive: true })

        try {
            // 使用 statfs 检查剩余空间 (Node.js 18+)
            const stats = await fs.statfs(absoluteBaseDir)
            const freeSpace = stats.bavail * stats.bsize // 可用块 (非 root) * 块大小

            if (freeSpace < this.env.LOCAL_STORAGE_MIN_FREE_SPACE) {
                console.error(`[Storage] 磁盘空间不足。剩余: ${freeSpace} 字节, 阈值: ${this.env.LOCAL_STORAGE_MIN_FREE_SPACE} 字节`)
                throw createError({
                    statusCode: 507,
                    statusMessage: '服务器磁盘空间不足，无法保存新文件。',
                })
            }
        } catch (error: any) {
            // 如果是因为不支持 statfs 或权限问题则记录警告，不阻塞上传（除非明确已满）
            if (error?.statusCode !== 507) {
                console.warn('[Storage] 磁盘空间检查失败，跳过检测:', error?.message)
            } else {
                throw error
            }
        }

        // 4. 持久化文件
        // 这里的 filename 可能包含子路径 (如 'file/20240101-abc.jpg')
        const fullPath = path.join(absoluteBaseDir, filename)
        const dir = path.dirname(fullPath)

        // 确保子目录存在
        await fs.mkdir(dir, { recursive: true })

        // 写入文件
        await fs.writeFile(fullPath, buffer)

        // 5. 生成可访问 URL
        // 确保使用正斜杠并拼接。由于 base 可能已经是带协议的完整 URL，建议确保以斜杠结尾后使用 URL 类拼接
        const normalizedFilename = filename.replace(/\\/g, '/')

        // 如果配置的是完整 URL (支持动静分离)
        if (this.env.LOCAL_STORAGE_BASE_URL.startsWith('http')) {
            const baseUrl = this.env.LOCAL_STORAGE_BASE_URL.endsWith('/')
                ? this.env.LOCAL_STORAGE_BASE_URL
                : `${this.env.LOCAL_STORAGE_BASE_URL}/`

            return { url: new URL(normalizedFilename, baseUrl).toString() }
        }

        // 默认行为：拼接基础路径 (通常为 /uploads)
        const webPath = path.posix.join(this.env.LOCAL_STORAGE_BASE_URL, normalizedFilename)

        return { url: webPath }
    }
}
