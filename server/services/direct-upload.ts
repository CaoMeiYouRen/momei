import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import {
    buildUploadObjectKey,
    checkUploadLimits,
    getUploadStorageContext,
    resolveUploadPrefix,
    resolveUploadedFileUrl,
    UploadType,
    validateUploadPayload,
} from './upload'
import { createS3Client, resolveS3Env } from '@/server/utils/storage/s3'

export interface DirectUploadAuthorizationRequest {
    userId: string
    filename: string
    contentType: string
    size: number
    type?: UploadType
    prefix?: string
}

export interface DirectUploadProxyStrategy {
    strategy: 'proxy'
}

export interface DirectUploadPresignStrategy {
    strategy: 'put-presign'
    method: 'PUT'
    url: string
    headers: Record<string, string>
    publicUrl: string
    objectKey: string
    expiresIn: number
}

export type DirectUploadAuthorization = DirectUploadProxyStrategy | DirectUploadPresignStrategy

export async function authorizeDirectUpload(input: DirectUploadAuthorizationRequest): Promise<DirectUploadAuthorization> {
    const { filename, contentType, size } = input
    const type = input.type ?? UploadType.IMAGE
    const prefix = resolveUploadPrefix(type, input.prefix)
    const storageContext = await getUploadStorageContext()

    validateUploadPayload({
        type,
        size,
        contentType,
        settings: storageContext.settings,
    })

    if (!['s3', 'r2'].includes(storageContext.normalizedStorageType)) {
        return {
            strategy: 'proxy',
        }
    }

    await checkUploadLimits(input.userId)

    const s3Env = resolveS3Env(storageContext.env)
    const s3Client = createS3Client(s3Env)
    const objectKey = buildUploadObjectKey({
        bucketPrefix: storageContext.bucketPrefix,
        prefix,
        originalFilename: filename,
    })
    const expiresIn = 300
    const command = new PutObjectCommand({
        Bucket: s3Env.S3_BUCKET_NAME,
        Key: objectKey,
        ContentType: contentType,
        ContentLength: size, // 将文件大小写入签名
    })
    const url = await getSignedUrl(s3Client, command, {
        expiresIn,
        // 把 content-length 加入签名校验，客户端必须完全匹配
        signableHeaders: new Set(['content-type', 'content-length']),
    })

    return {
        strategy: 'put-presign',
        method: 'PUT',
        url,
        headers: {
            'content-type': contentType,
            'content-length': size.toString(),
        },
        publicUrl: resolveUploadedFileUrl(objectKey, storageContext),
        objectKey,
        expiresIn,
    }
}
