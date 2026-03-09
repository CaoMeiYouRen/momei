import { S3Client, PutObjectCommand, type PutObjectCommandInput } from '@aws-sdk/client-s3'
import type { Storage } from './type'

export interface S3Env {
    // S3 基础 URL
    S3_BASE_URL?: string
    // S3 区域
    S3_REGION?: string
    // S3 存储桶名称
    S3_BUCKET_NAME?: string
    // 兼容旧字段名
    S3_BUCKET?: string
    // S3 访问密钥 ID
    S3_ACCESS_KEY_ID?: string
    // 兼容旧字段名
    S3_ACCESS_KEY?: string
    // S3 秘密访问密钥
    S3_SECRET_ACCESS_KEY?: string
    // 兼容旧字段名
    S3_SECRET_KEY?: string
    // S3 端点
    S3_ENDPOINT?: string
}

export interface ResolvedS3Env {
    S3_BASE_URL: string
    S3_REGION: string
    S3_BUCKET_NAME: string
    S3_ACCESS_KEY_ID: string
    S3_SECRET_ACCESS_KEY: string
    S3_ENDPOINT: string
}

export function resolveS3Env(env: S3Env): ResolvedS3Env {
    const bucketName = env.S3_BUCKET_NAME || env.S3_BUCKET || ''
    const accessKeyId = env.S3_ACCESS_KEY_ID || env.S3_ACCESS_KEY || ''
    const secretAccessKey = env.S3_SECRET_ACCESS_KEY || env.S3_SECRET_KEY || ''
    const region = env.S3_REGION || 'auto'
    const endpoint = env.S3_ENDPOINT || `https://${bucketName}.s3.${region}.amazonaws.com`
    const baseUrl = env.S3_BASE_URL || endpoint

    return {
        S3_BASE_URL: baseUrl,
        S3_REGION: region,
        S3_BUCKET_NAME: bucketName,
        S3_ACCESS_KEY_ID: accessKeyId,
        S3_SECRET_ACCESS_KEY: secretAccessKey,
        S3_ENDPOINT: endpoint,
    }
}

export function shouldUseS3PathStyle(env: ResolvedS3Env): boolean {
    try {
        const url = new URL(env.S3_ENDPOINT)
        return !url.hostname.endsWith('.amazonaws.com')
    } catch {
        // Fallback for invalid URLs
        return false
    }
}

export function createS3Client(env: S3Env): S3Client {
    const resolvedEnv = resolveS3Env(env)

    return new S3Client({
        region: resolvedEnv.S3_REGION,
        endpoint: resolvedEnv.S3_ENDPOINT,
        forcePathStyle: shouldUseS3PathStyle(resolvedEnv),
        credentials: {
            accessKeyId: resolvedEnv.S3_ACCESS_KEY_ID,
            secretAccessKey: resolvedEnv.S3_SECRET_ACCESS_KEY,
        },
    })
}

/**
 * S3 存储
 * 需要设置 S3_BUCKET_NAME, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY，可选 S3_BASE_URL
 */
export class S3Storage implements Storage {
    private s3Client: S3Client
    private env: ResolvedS3Env

    constructor(env: S3Env) {
        this.env = resolveS3Env(env)
        this.s3Client = createS3Client(this.env)
    }

    async upload(buffer: Buffer, filename: string, contentType?: string): Promise<{ url: string }> {
        const params: PutObjectCommandInput = {
            Bucket: this.env.S3_BUCKET_NAME,
            Key: filename,
            Body: buffer,
            ContentType: contentType,
        }

        const command = new PutObjectCommand(params)
        await this.s3Client.send(command)
        const url = new URL(filename, this.env.S3_BASE_URL)
        return { url: url.toString() }
    }
}
