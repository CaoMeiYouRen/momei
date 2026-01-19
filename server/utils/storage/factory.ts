import { type S3Env, S3Storage } from './s3'
import { VercelBlobStorage, type VercelEnv } from './vercel-blob'
import { type LocalEnv, LocalStorage } from './local'
import type { Storage } from './type'

export type FileStorageEnv = S3Env & VercelEnv & LocalEnv

/**
 * 获取文件存储实例。支持 s3, vercel-blob 和 local
 *
 * @author CaoMeiYouRen
 * @date 2025-07-15
 * @export
 * @param type
 * @param env
 */
export function getFileStorage(type: string, env: FileStorageEnv): Storage {
    switch (type) {
        case 's3':
            return new S3Storage(env)
        case 'vercel-blob':
            return new VercelBlobStorage(env)
        case 'local':
            return new LocalStorage(env)
        default:
            throw new Error(`Unsupported storage type: ${type}`)
    }
}
