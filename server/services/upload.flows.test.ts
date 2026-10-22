import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { readMultipartFormData } from 'h3'
import {
    buildUploadStoredFilename,
    getUploadStorageContext,
    handleFileUploads,
    resolveUploadPublicBaseUrl,
    resolveUploadSizeLimit,
    uploadFromBuffer,
    uploadFromUrl,
    UploadType,
    validateUploadPayload,
} from './upload'
import { limiterStorage } from '@/server/database/storage'
import { getFileStorage } from '@/server/utils/storage/factory'
import { getSettings } from '~/server/services/setting'

vi.mock('@/server/database/storage', () => ({
    limiterStorage: {
        increment: vi.fn(),
    },
}))

vi.mock('@/server/utils/storage/factory', () => ({
    getFileStorage: vi.fn(),
}))

vi.mock('~/server/services/setting', () => ({
    getSettings: vi.fn(),
}))

vi.mock('h3', async (importOriginal) => {
    const original = await importOriginal<typeof import('h3')>()
    return {
        ...original,
        readMultipartFormData: vi.fn(),
    }
})

const baseSettings = {
    storage_type: 'local',
    local_storage_dir: 'public/uploads',
    local_storage_base_url: '/uploads',
    local_storage_min_free_space: String(100 * 1024 * 1024),
    asset_public_base_url: '',
    asset_object_prefix: '',
    s3_endpoint: 'https://s3.example.com',
    s3_bucket: 'bucket',
    s3_region: 'auto',
    s3_access_key: 'key',
    s3_secret_key: 'secret',
    s3_base_url: 'https://cdn.example.com',
    s3_bucket_prefix: '',
    vercel_blob_token: '',
    cloudflare_r2_account_id: '',
    cloudflare_r2_access_key: '',
    cloudflare_r2_secret_key: '',
    cloudflare_r2_bucket: '',
    cloudflare_r2_base_url: '',
    max_upload_size: '10',
    max_audio_upload_size: '20',
    allowed_file_types: '',
    upload_limit_window: '86400',
    upload_daily_limit: '100',
    upload_single_user_daily_limit: '5',
}

function createStorage() {
    return {
        upload: vi.fn().mockResolvedValue({ url: 'https://storage.example.com/file' }),
    }
}

describe('uploadFromUrl', () => {
    const storage = createStorage()
    let server: Server
    let baseUrl = ''

    beforeAll(async () => {
        server = createServer((request, response) => {
            switch (request.url) {
                case '/image':
                    response.writeHead(200, { 'content-type': 'image/png' })
                    response.end(Buffer.from('image-bytes'))
                    return
                case '/no-type':
                    response.writeHead(200)
                    response.end(Buffer.from('blob'))
                    return
                case '/html':
                    response.writeHead(200, { 'content-type': 'text/html' })
                    response.end(Buffer.from('<html></html>'))
                    return
                case '/large':
                    response.writeHead(200, { 'content-type': 'image/png' })
                    response.end(Buffer.alloc(2048, 'x'))
                    return
                default:
                    response.writeHead(404)
                    response.end()
            }
        })

        await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
        const address = server.address() as AddressInfo
        baseUrl = `http://127.0.0.1:${address.port}`
    })

    afterAll(async () => {
        await new Promise<void>((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()))
        })
    })

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(getSettings).mockResolvedValue(baseSettings)
        vi.mocked(limiterStorage.increment).mockResolvedValue(1)
        vi.mocked(getFileStorage).mockReturnValue(storage as never)
        storage.upload.mockClear()
    })

    it('根据响应 Content-Type 推断扩展名并上传到驱动', async () => {
        const result = await uploadFromUrl(`${baseUrl}/image`, 'image/', 'user-1')

        expect(limiterStorage.increment).toHaveBeenCalledWith('upload_global_limit', 86400)
        expect(storage.upload).toHaveBeenCalledWith(expect.any(Buffer), expect.stringMatching(/^image\/\d{17}-[a-z0-9]{7}\.png$/), 'image/png')
        expect(result.mimetype).toBe('image/png')
        expect(result.url).toMatch(/^\/uploads\/image\/\d{17}-[a-z0-9]{7}\.png$/)
    })

    it('缺少 Content-Type 时回退 application/octet-stream 扩展名', async () => {
        const result = await uploadFromUrl(`${baseUrl}/no-type`, 'file/', 'user-1')

        expect(result.mimetype).toBe('application/octet-stream')
        expect(result.filename).toMatch(/^\d{17}-[a-z0-9]{7}\.octet-stream$/)
    })

    it('自定义文件名经过清洗后作为前缀', async () => {
        const result = await uploadFromUrl(`${baseUrl}/image`, 'image/', 'user-1', '../../Cover Image')

        expect(result.filename).toMatch(/^Cover-Image-\d{17}-[a-z0-9]{7}\.png$/)
    })

    it('下载内容不在允许类型白名单时拒绝上传', async () => {
        vi.mocked(getSettings).mockResolvedValue({
            ...baseSettings,
            allowed_file_types: 'image/*',
        })

        await expect(uploadFromUrl(`${baseUrl}/html`, 'file/', 'user-1'))
            .rejects.toThrow('文件类型不被允许')
        expect(storage.upload).not.toHaveBeenCalled()
    })

    it('超过大小上限时拒绝上传', async () => {
        vi.mocked(getSettings).mockResolvedValue({
            ...baseSettings,
            max_upload_size: '0.000001',
        })

        await expect(uploadFromUrl(`${baseUrl}/large`, 'image/', 'user-1'))
            .rejects.toThrow(/文件大小超出/)
        expect(storage.upload).not.toHaveBeenCalled()
    })
})

describe('uploadFromBuffer', () => {
    const storage = createStorage()

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(getSettings).mockResolvedValue(baseSettings)
        vi.mocked(limiterStorage.increment).mockResolvedValue(1)
        vi.mocked(getFileStorage).mockReturnValue(storage as never)
        storage.upload.mockClear()
    })

    it('带用户 ID 时先校验上传限额', async () => {
        const result = await uploadFromBuffer(Buffer.from('audio'), 'audio/', 'voice.mp3', 'audio/mpeg', 'user-1')

        expect(limiterStorage.increment).toHaveBeenCalledTimes(2)
        expect(storage.upload).toHaveBeenCalledWith(expect.any(Buffer), 'audio/voice.mp3', 'audio/mpeg')
        expect(result).toEqual({
            filename: 'voice.mp3',
            url: '/uploads/audio/voice.mp3',
            mimetype: 'audio/mpeg',
        })
    })

    it('未提供用户 ID 时跳过敏额校验', async () => {
        await uploadFromBuffer(Buffer.from('file'), 'file/', 'notes.txt', 'text/plain')

        expect(limiterStorage.increment).not.toHaveBeenCalled()
        expect(storage.upload).toHaveBeenCalledOnce()
    })

    it('音频类型超过音频限额时拒绝', async () => {
        vi.mocked(getSettings).mockResolvedValue({
            ...baseSettings,
            max_audio_upload_size: '0.000001',
        })

        await expect(uploadFromBuffer(Buffer.alloc(16), 'audio/', 'huge.mp3', 'audio/mpeg', 'user-1'))
            .rejects.toThrow(/文件大小超出/)
    })

    it('图片类型超过通用限额时拒绝', async () => {
        vi.mocked(getSettings).mockResolvedValue({
            ...baseSettings,
            max_upload_size: '0.000001',
        })

        await expect(uploadFromBuffer(Buffer.alloc(2048), 'image/', 'huge.png', 'image/png', 'user-1'))
            .rejects.toThrow(/文件大小超出/)
    })
})

describe('handleFileUploads 边界', () => {
    const event = {} as never
    const storage = createStorage()

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(getSettings).mockResolvedValue(baseSettings)
        vi.mocked(getFileStorage).mockReturnValue(storage as never)
        storage.upload.mockClear()
    })

    it('跳过没有文件名的 multipart 字段', async () => {
        vi.mocked(readMultipartFormData).mockResolvedValue([
            { name: 'title', data: Buffer.from('hello') },
            { filename: 'cover.png', data: Buffer.from('image'), type: 'image/png' },
        ] as never)

        const result = await handleFileUploads(event, { prefix: 'image/' })

        expect(result).toHaveLength(1)
        expect(result[0]?.filename).toBe('cover.png')
        expect(storage.upload).toHaveBeenCalledOnce()
    })

    it('全部为普通字段时返回 400', async () => {
        vi.mocked(readMultipartFormData).mockResolvedValue([
            { name: 'title', data: Buffer.from('hello') },
        ] as never)

        await expect(handleFileUploads(event, { prefix: 'image/' }))
            .rejects.toThrow('No valid files uploaded')
        expect(storage.upload).not.toHaveBeenCalled()
    })

    it('mustBeImage 为 false 时按普通文件处理并允许非图片', async () => {
        vi.mocked(readMultipartFormData).mockResolvedValue([
            { filename: 'notes.txt', data: Buffer.from('text'), type: 'text/plain' },
        ] as never)

        const result = await handleFileUploads(event, {
            prefix: 'file/',
            mustBeImage: false,
        })

        expect(result[0]?.mimetype).toBe('text/plain')
        expect(storage.upload).toHaveBeenCalledOnce()
    })

    it('默认最多允许 10 个文件', async () => {
        const files = Array.from({ length: 11 }, (_, index) => ({
            filename: `image-${index}.png`,
            data: Buffer.from('x'),
            type: 'image/png',
        }))
        vi.mocked(readMultipartFormData).mockResolvedValue(files as never)

        await expect(handleFileUploads(event, { prefix: 'image/' }))
            .rejects.toThrow('最多允许同时上传 10 个文件')
    })

    it('自定义 maxFiles 生效', async () => {
        vi.mocked(readMultipartFormData).mockResolvedValue([
            { filename: 'a.png', data: Buffer.from('x'), type: 'image/png' },
            { filename: 'b.png', data: Buffer.from('x'), type: 'image/png' },
        ] as never)

        await expect(handleFileUploads(event, { prefix: 'image/', maxFiles: 1 }))
            .rejects.toThrow('最多允许同时上传 1 个文件')
    })

    it('图片上传类型收到非图片文件时拒绝', async () => {
        vi.mocked(readMultipartFormData).mockResolvedValue([
            { filename: 'script.sh', data: Buffer.from('echo'), type: 'text/plain' },
        ] as never)

        await expect(handleFileUploads(event, { prefix: 'image/', type: UploadType.IMAGE }))
            .rejects.toThrow('仅支持图片上传')
    })
})

describe('getUploadStorageContext 存储分支', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('vercel-blob 别名归一化并保留 Blob token', async () => {
        vi.mocked(getSettings).mockResolvedValue({
            ...baseSettings,
            storage_type: 'vercel-blob',
            asset_public_base_url: 'https://blob.example.com',
            vercel_blob_token: 'blob-token',
        })

        const context = await getUploadStorageContext()

        expect(context.rawStorageType).toBe('vercel-blob')
        expect(context.normalizedStorageType).toBe('vercel_blob')
        expect(context.env.VERCEL_BLOB_TOKEN).toBe('blob-token')
        expect(context.env.BLOB_READ_WRITE_TOKEN).toBe('blob-token')
        expect(context.driverBaseUrl).toBe('https://blob.example.com')
    })

    it('R2 缺少账号或桶时端点与基础地址为空', async () => {
        vi.mocked(getSettings).mockResolvedValue({
            ...baseSettings,
            storage_type: 'r2',
            cloudflare_r2_account_id: '',
            cloudflare_r2_bucket: '',
            cloudflare_r2_base_url: '',
        })

        const context = await getUploadStorageContext()

        expect(context.env.S3_ENDPOINT).toBe('')
        expect(context.env.S3_BASE_URL).toBe('')
        expect(context.env.S3_REGION).toBe('auto')
    })

    it('R2 缺少自定义基础地址时回退到端点/桶拼接', async () => {
        vi.mocked(getSettings).mockResolvedValue({
            ...baseSettings,
            storage_type: 'r2',
            cloudflare_r2_account_id: 'account-id',
            cloudflare_r2_bucket: 'r2-bucket',
            cloudflare_r2_base_url: '',
        })

        const context = await getUploadStorageContext()

        expect(context.env.S3_BASE_URL).toBe('https://account-id.r2.cloudflarestorage.com/r2-bucket')
    })

    it('未知存储类型回退到 S3_BASE_URL 并保留原始类型', async () => {
        vi.mocked(getSettings).mockResolvedValue({
            ...baseSettings,
            storage_type: 'custom-driver',
        })

        const context = await getUploadStorageContext()

        expect(context.rawStorageType).toBe('custom-driver')
        expect(context.normalizedStorageType).toBe('custom-driver')
        expect(context.driverBaseUrl).toBe('https://cdn.example.com')
    })

    it('本地最小剩余空间非法时回退 100MB', async () => {
        vi.mocked(getSettings).mockResolvedValue({
            ...baseSettings,
            local_storage_min_free_space: 'not-a-number',
        })

        const context = await getUploadStorageContext()

        expect(context.env.LOCAL_STORAGE_MIN_FREE_SPACE).toBe(100 * 1024 * 1024)
    })
})

describe('resolveUploadPublicBaseUrl 优先级', () => {
    const env = { S3_BASE_URL: 'https://env-base.example.com' } as never

    it('全局资产域名优先于驱动域名', () => {
        expect(resolveUploadPublicBaseUrl({
            asset_public_base_url: 'https://assets.example.com',
            s3_base_url: 'https://s3.example.com',
        }, 's3', env)).toBe('https://assets.example.com')
    })

    it('按驱动类型选择专属域名', () => {
        expect(resolveUploadPublicBaseUrl({ cloudflare_r2_base_url: 'https://r2.example.com' }, 'r2', env))
            .toBe('https://r2.example.com')
        expect(resolveUploadPublicBaseUrl({ s3_base_url: 'https://s3.example.com' }, 's3', env))
            .toBe('https://s3.example.com')
        expect(resolveUploadPublicBaseUrl({ local_storage_base_url: '/uploads' }, 'local', env))
            .toBe('/uploads')
    })

    it('vercel_blob 复用全局资产域名', () => {
        expect(resolveUploadPublicBaseUrl({ asset_public_base_url: 'https://blob.example.com' }, 'vercel_blob', env))
            .toBe('https://blob.example.com')
        expect(resolveUploadPublicBaseUrl({ asset_public_base_url: 'https://blob.example.com' }, 'vercel-blob', env))
            .toBe('https://blob.example.com')
    })

    it('未匹配驱动时回退 env.S3_BASE_URL 或空串', () => {
        expect(resolveUploadPublicBaseUrl({}, 'unknown', env)).toBe('https://env-base.example.com')
        expect(resolveUploadPublicBaseUrl({}, 'unknown', {} as never)).toBe('')
    })
})

describe('validateUploadPayload 类型规则', () => {
    it('图片类型缺少 Content-Type 时拒绝', () => {
        expect(() => validateUploadPayload({
            type: UploadType.IMAGE,
            size: 1,
            filename: 'image.png',
            settings: {},
        })).toThrow('仅支持图片上传')
    })

    it('通配规则允许任意类型', () => {
        expect(() => validateUploadPayload({
            type: UploadType.FILE,
            size: 1,
            contentType: 'application/zip',
            filename: 'archive.zip',
            settings: { allowed_file_types: '*' },
        })).not.toThrow()
    })

    it('精确 MIME 规则匹配带参数的 Content-Type', () => {
        expect(() => validateUploadPayload({
            type: UploadType.IMAGE,
            size: 1,
            contentType: 'image/png; charset=binary',
            filename: 'image.png',
            settings: { allowed_file_types: 'image/png' },
        })).not.toThrow()
    })

    it('MIME 规则在缺少 Content-Type 时拒绝', () => {
        expect(() => validateUploadPayload({
            type: UploadType.FILE,
            size: 1,
            filename: 'unknown.bin',
            settings: { allowed_file_types: 'image/png' },
        })).toThrow('文件类型不被允许')
    })

    it('扩展名规则在缺少扩展名时拒绝', () => {
        expect(() => validateUploadPayload({
            type: UploadType.FILE,
            size: 1,
            filename: 'README',
            settings: { allowed_file_types: 'png' },
        })).toThrow('文件类型不被允许')
    })

    it('MIME 大类通配不匹配其他大类', () => {
        expect(() => validateUploadPayload({
            type: UploadType.FILE,
            size: 1,
            contentType: 'video/mp4',
            filename: 'clip.mp4',
            settings: { allowed_file_types: 'image/*' },
        })).toThrow('文件类型不被允许')
    })

    it('文件类型超过默认 10MB 限制时拒绝', () => {
        expect(() => validateUploadPayload({
            type: UploadType.FILE,
            size: 10 * 1024 * 1024 + 1,
            contentType: 'application/zip',
            filename: 'archive.zip',
            settings: {},
        })).toThrow(/文件大小超出/)
    })

    it('音频类型使用音频限额', () => {
        expect(resolveUploadSizeLimit(UploadType.AUDIO, {})).toEqual({
            bytes: 20 * 1024 * 1024,
            text: '20MB',
        })
        expect(resolveUploadSizeLimit(UploadType.FILE, {})).toEqual({
            bytes: 10 * 1024 * 1024,
            text: '10MB',
        })
    })
})

describe('buildUploadStoredFilename 清洗', () => {
    it('扩展名已带点前缀时不重复添加', () => {
        expect(buildUploadStoredFilename({ basename: 'cover', extension: '.png' }))
            .toMatch(/^cover-\d{17}-[a-z0-9]{7}\.png$/)
    })

    it('保留 Unicode 字母并折叠空白与非法字符', () => {
        expect(buildUploadStoredFilename({ basename: '封面   图片@2x', extension: 'png' }))
            .toMatch(/^封面-图片-2x-\d{17}-[a-z0-9]{7}\.png$/)
    })

    it('basename 清洗为空时只保留时间戳与随机串', () => {
        expect(buildUploadStoredFilename({ basename: '   ', extension: 'png' }))
            .toMatch(/^\d{17}-[a-z0-9]{7}\.png$/)
    })
})
