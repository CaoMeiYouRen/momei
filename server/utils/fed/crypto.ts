import crypto from 'node:crypto'
import { dataSource } from '@/server/database'
import { FedKey } from '@/server/entities/fed-key'
import type { RSAKeyPair, HTTPSignatureParams, HTTPSignatureVerification } from '@/types/federation'

/**
 * 联邦协议加密工具
 * 提供 RSA 密钥管理和 HTTP 签名功能
 *
 * @author CaoMeiYouRen
 * @date 2025-03-04
 */

/**
 * 加密密钥 (从环境变量获取)
 */
const getEncryptionKey = (): string => {
    const key = process.env.FED_KEY_SECRET || process.env.WEBHOOK_SECRET
    if (!key) {
        throw new Error('FED_KEY_SECRET or WEBHOOK_SECRET environment variable is required for federation encryption')
    }
    return key
}

/**
 * 生成 RSA 密钥对
 * @returns RSA 公钥和私钥 (PEM 格式)
 */
export async function generateKeyPair(): Promise<RSAKeyPair> {
    return new Promise((resolve, reject) => {
        crypto.generateKeyPair(
            'rsa',
            {
                modulusLength: 2048,
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'pem',
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'pem',
                },
            },
            (err, publicKey, privateKey) => {
                if (err) {
                    reject(err)
                } else {
                    resolve({ publicKey, privateKey })
                }
            },
        )
    })
}

/**
 * 加密私钥
 * @param privateKey 私钥 (PEM 格式)
 * @returns 加密后的私钥
 */
export function encryptPrivateKey(privateKey: string): string {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(16)
    const derivedKey = crypto.scryptSync(key, 'fed-salt', 32)

    const cipher = crypto.createCipheriv('aes-256-cbc', derivedKey, iv)
    let encrypted = cipher.update(privateKey, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    return `${iv.toString('hex')}:${encrypted}`
}

/**
 * 解密私钥
 * @param encryptedPrivateKey 加密的私钥
 * @returns 解密后的私钥 (PEM 格式)
 */
export function decryptPrivateKey(encryptedPrivateKey: string): string {
    const key = getEncryptionKey()
    const [ivHex, encrypted] = encryptedPrivateKey.split(':')

    if (!ivHex || !encrypted) {
        throw new Error('Invalid encrypted private key format')
    }

    const iv = Buffer.from(ivHex, 'hex')
    const derivedKey = crypto.scryptSync(key, 'fed-salt', 32)

    const decipher = crypto.createDecipheriv('aes-256-cbc', derivedKey, iv)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
}

/**
 * 获取或创建用户的密钥对
 * @param userId 用户 ID
 * @returns RSA 密钥对 (私钥已解密)
 */
export async function getOrCreateUserKeyPair(userId: string): Promise<RSAKeyPair> {
    const fedKeyRepo = dataSource.getRepository(FedKey)

    // 查找现有密钥
    let fedKey = await fedKeyRepo.findOne({ where: { userId } })

    if (fedKey) {
        return {
            publicKey: fedKey.publicKey,
            privateKey: decryptPrivateKey(fedKey.privateKey),
        }
    }

    // 生成新密钥对
    const keyPair = await generateKeyPair()

    // 存储密钥 (私钥加密)
    fedKey = fedKeyRepo.create({
        userId,
        publicKey: keyPair.publicKey,
        privateKey: encryptPrivateKey(keyPair.privateKey),
    })

    await fedKeyRepo.save(fedKey)

    return keyPair
}

/**
 * 获取用户公钥
 * @param userId 用户 ID
 * @returns 公钥 (PEM 格式)
 */
export async function getUserPublicKey(userId: string): Promise<string> {
    const fedKeyRepo = dataSource.getRepository(FedKey)
    const fedKey = await fedKeyRepo.findOne({ where: { userId } })

    if (!fedKey) {
        // 如果不存在，创建新密钥对
        const keyPair = await getOrCreateUserKeyPair(userId)
        return keyPair.publicKey
    }

    return fedKey.publicKey
}

/**
 * 生成 HTTP 签名
 * @param params 签名参数
 * @param privateKey 私钥 (PEM 格式)
 * @returns 签名值 (Base64)
 */
export function generateHTTPSignature(
    params: {
        keyId: string
        method: string
        url: string
        headers: Record<string, string>
        headerNames: string[]
    },
    privateKey: string,
): string {
    const { keyId, method, url, headers, headerNames } = params

    // 构建签名字符串
    const signingString = headerNames
        .map((name) => {
            const value = name === '(request-target)'
                ? `${method.toLowerCase()} ${new URL(url).pathname}`
                : headers[name]
            return `${name}: ${value}`
        })
        .join('\n')

    // 签名
    const sign = crypto.createSign('rsa-sha256')
    sign.update(signingString)
    const signature = sign.sign(privateKey, 'base64')

    // 构建 Signature header
    const headersList = headerNames.join(' ')
    return `keyId="${keyId}",algorithm="rsa-sha256",headers="${headersList}",signature="${signature}"`
}

/**
 * 解析 HTTP Signature header
 * @param signatureHeader Signature header 值
 * @returns 解析后的签名参数
 */
export function parseSignatureHeader(signatureHeader: string): HTTPSignatureParams {
    const params: Record<string, string> = {}

    signatureHeader.split(',').forEach((part) => {
        const [key, ...valueParts] = part.split('=')
        if (key) {
            const value = valueParts.join('=').replace(/^"|"$/g, '')
            params[key.trim()] = value
        }
    })

    return {
        keyId: params.keyId || '',
        headers: (params.headers || 'date').split(' '),
        signature: params.signature || '',
        algorithm: params.algorithm,
    }
}

/**
 * 验证 HTTP 签名
 * @param params 验证参数
 * @param publicKey 公钥 (PEM 格式)
 * @returns 验证结果
 */
export function verifyHTTPSignature(
    params: {
        method: string
        url: string
        headers: Record<string, string>
        signatureHeader: string
    },
    publicKey: string,
): HTTPSignatureVerification {
    try {
        const { method, url, headers, signatureHeader } = params
        const parsed = parseSignatureHeader(signatureHeader)

        // 构建签名字符串
        const signingString = parsed.headers
            .map((name) => {
                const value = name === '(request-target)'
                    ? `${method.toLowerCase()} ${new URL(url).pathname}`
                    : headers[name]
                if (value === undefined) {
                    throw new Error(`Missing header: ${name}`)
                }
                return `${name}: ${value}`
            })
            .join('\n')

        // 验证签名
        const verify = crypto.createVerify('rsa-sha256')
        verify.update(signingString)

        const isValid = verify.verify(publicKey, parsed.signature, 'base64')

        return {
            valid: isValid,
            keyId: parsed.keyId,
        }
    } catch (error: any) {
        return {
            valid: false,
            error: error.message,
        }
    }
}

/**
 * 生成摘要头 (用于 POST 请求)
 * @param body 请求体
 * @returns Digest header 值
 */
export function generateDigestHeader(body: string): string {
    const hash = crypto.createHash('sha256')
    hash.update(body)
    return `SHA-256=${hash.digest('base64')}`
}

/**
 * 验证摘要头
 * @param digestHeader Digest header 值
 * @param body 请求体
 * @returns 是否匹配
 */
export function verifyDigestHeader(digestHeader: string, body: string): boolean {
    const match = /^SHA-256=(.+)$/.exec(digestHeader)
    if (!match) {
        return false
    }

    const expectedHash = match[1]
    const hash = crypto.createHash('sha256')
    hash.update(body)
    const actualHash = hash.digest('base64')

    return expectedHash === actualHash
}
