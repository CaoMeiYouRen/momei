import { describe, it, expect, vi } from 'vitest'
import {
    generateKeyPair,
    encryptPrivateKey,
    decryptPrivateKey,
    parseSignatureHeader,
    generateDigestHeader,
    verifyDigestHeader,
} from '@/server/utils/fed/crypto'

// Mock 环境变量
vi.stubEnv('WEBHOOK_SECRET', 'test-webhook-secret-for-testing')

describe('Fed Crypto Utils', () => {
    describe('generateKeyPair', () => {
        it('应该生成 RSA 密钥对', async () => {
            const keyPair = await generateKeyPair()

            expect(keyPair.publicKey).toBeDefined()
            expect(keyPair.privateKey).toBeDefined()
            expect(keyPair.publicKey).toContain('-----BEGIN PUBLIC KEY-----')
            expect(keyPair.privateKey).toContain('-----BEGIN PRIVATE KEY-----')
        })

        it('每次调用应该生成不同的密钥对', async () => {
            const keyPair1 = await generateKeyPair()
            const keyPair2 = await generateKeyPair()

            expect(keyPair1.publicKey).not.toBe(keyPair2.publicKey)
            expect(keyPair1.privateKey).not.toBe(keyPair2.privateKey)
        })
    })

    describe('encryptPrivateKey / decryptPrivateKey', () => {
        it('应该正确加密和解密私钥', () => {
            const privateKey = '-----BEGIN PRIVATE KEY-----\ntest-private-key-content\n-----END PRIVATE KEY-----'

            const encrypted = encryptPrivateKey(privateKey)
            const decrypted = decryptPrivateKey(encrypted)

            expect(decrypted).toBe(privateKey)
        })

        it('加密结果应该每次不同 (由于随机 IV)', () => {
            const privateKey = '-----BEGIN PRIVATE KEY-----\ntest-private-key-content\n-----END PRIVATE KEY-----'

            const encrypted1 = encryptPrivateKey(privateKey)
            const encrypted2 = encryptPrivateKey(privateKey)

            expect(encrypted1).not.toBe(encrypted2)
        })

        it('加密结果应该包含 IV 和密文 (用冒号分隔)', () => {
            const privateKey = 'test-key'
            const encrypted = encryptPrivateKey(privateKey)

            expect(encrypted).toMatch(/^[a-f0-9]+:[a-f0-9]+$/)
        })

        it('解密无效格式应该抛出错误', () => {
            expect(() => decryptPrivateKey('invalid-format')).toThrow()
        })
    })

    describe('parseSignatureHeader', () => {
        it('应该正确解析签名头', () => {
            const signatureHeader = 'keyId="https://example.com/actor#main-key",algorithm="rsa-sha256",headers="(request-target) host date",signature="base64-signature"'

            const result = parseSignatureHeader(signatureHeader)

            expect(result.keyId).toBe('https://example.com/actor#main-key')
            expect(result.algorithm).toBe('rsa-sha256')
            expect(result.headers).toEqual(['(request-target)', 'host', 'date'])
            expect(result.signature).toBe('base64-signature')
        })

        it('应该处理缺少的字段', () => {
            const signatureHeader = 'keyId="test-key",signature="test-sig"'

            const result = parseSignatureHeader(signatureHeader)

            expect(result.keyId).toBe('test-key')
            expect(result.signature).toBe('test-sig')
            expect(result.headers).toEqual(['date']) // 默认值
            expect(result.algorithm).toBeUndefined()
        })

        it('应该处理空签名头', () => {
            const result = parseSignatureHeader('')

            expect(result.keyId).toBe('')
            expect(result.signature).toBe('')
            expect(result.headers).toEqual(['date'])
        })
    })

    describe('generateDigestHeader / verifyDigestHeader', () => {
        it('应该生成正确的 SHA-256 摘要头', () => {
            const body = '{"test": "content"}'
            const digest = generateDigestHeader(body)

            expect(digest).toMatch(/^SHA-256=[A-Za-z0-9+/]+=*$/)
        })

        it('相同内容应该生成相同摘要', () => {
            const body = '{"test": "content"}'
            const digest1 = generateDigestHeader(body)
            const digest2 = generateDigestHeader(body)

            expect(digest1).toBe(digest2)
        })

        it('不同内容应该生成不同摘要', () => {
            const digest1 = generateDigestHeader('content1')
            const digest2 = generateDigestHeader('content2')

            expect(digest1).not.toBe(digest2)
        })

        it('应该正确验证匹配的摘要', () => {
            const body = '{"test": "content"}'
            const digest = generateDigestHeader(body)

            expect(verifyDigestHeader(digest, body)).toBe(true)
        })

        it('应该拒绝不匹配的摘要', () => {
            const digest = generateDigestHeader('original-content')

            expect(verifyDigestHeader(digest, 'different-content')).toBe(false)
        })

        it('应该拒绝无效格式的摘要', () => {
            expect(verifyDigestHeader('invalid-format', 'content')).toBe(false)
            expect(verifyDigestHeader('MD5=abc123', 'content')).toBe(false)
        })
    })
})
