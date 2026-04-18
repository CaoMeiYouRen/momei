import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockFedKeyRepo } = vi.hoisted(() => ({
    mockFedKeyRepo: {
        findOne: vi.fn(),
        create: vi.fn((payload: Record<string, unknown>) => payload),
        save: vi.fn(async (payload: Record<string, unknown>) => payload),
    },
}))

vi.stubEnv('WEBHOOK_SECRET', 'test-webhook-secret-for-testing')

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: () => mockFedKeyRepo,
    },
}))

import {
    decryptPrivateKey,
    encryptPrivateKey,
    generateHTTPSignature,
    generateKeyPair,
    getOrCreateUserKeyPair,
    getUserPublicKey,
    verifyHTTPSignature,
} from '@/server/utils/fed/crypto'

describe('fed crypto key management', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns existing decrypted key pairs without regenerating', async () => {
        const existingPrivateKey = '-----BEGIN PRIVATE KEY-----\nexisting-private-key\n-----END PRIVATE KEY-----'
        mockFedKeyRepo.findOne.mockResolvedValueOnce({
            userId: 'user-1',
            publicKey: 'existing-public-key',
            privateKey: encryptPrivateKey(existingPrivateKey),
        })

        await expect(getOrCreateUserKeyPair('user-1')).resolves.toEqual({
            publicKey: 'existing-public-key',
            privateKey: existingPrivateKey,
        })
        expect(mockFedKeyRepo.save).not.toHaveBeenCalled()
    })

    it('creates and stores a new encrypted key pair when absent', async () => {
        mockFedKeyRepo.findOne.mockResolvedValueOnce(null)

        const keyPair = await getOrCreateUserKeyPair('user-2')

        expect(keyPair.publicKey).toContain('BEGIN PUBLIC KEY')
        expect(keyPair.privateKey).toContain('BEGIN PRIVATE KEY')
        expect(mockFedKeyRepo.create).toHaveBeenCalledWith(expect.objectContaining({
            userId: 'user-2',
            publicKey: keyPair.publicKey,
            privateKey: expect.any(String),
        }))
        const savedPayload = mockFedKeyRepo.save.mock.calls[0]?.[0] as { privateKey: string }
        expect(savedPayload.privateKey).not.toContain('BEGIN PRIVATE KEY')
        expect(decryptPrivateKey(savedPayload.privateKey)).toBe(keyPair.privateKey)
    })

    it('returns existing public keys directly', async () => {
        mockFedKeyRepo.findOne.mockResolvedValueOnce({ publicKey: 'existing-public-key' })

        await expect(getUserPublicKey('user-3')).resolves.toBe('existing-public-key')
    })

    it('creates a key pair when fetching a missing public key', async () => {
        mockFedKeyRepo.findOne
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null)

        const publicKey = await getUserPublicKey('user-4')

        expect(publicKey).toContain('BEGIN PUBLIC KEY')
        expect(mockFedKeyRepo.save).toHaveBeenCalledTimes(1)
    })

    it('generates verifiable HTTP signatures for request-target and headers', async () => {
        const { publicKey, privateKey } = await generateKeyPair()
        const signatureHeader = generateHTTPSignature({
            keyId: 'https://example.com/fed/actor/user-1#main-key',
            method: 'POST',
            url: 'https://example.com/inbox?ignored=query',
            headers: {
                host: 'example.com',
                date: 'Tue, 01 Jan 2024 00:00:00 GMT',
                digest: 'SHA-256=test',
            },
            headerNames: ['(request-target)', 'host', 'date', 'digest'],
        }, privateKey)

        expect(verifyHTTPSignature({
            method: 'POST',
            url: 'https://example.com/inbox?ignored=query',
            headers: {
                host: 'example.com',
                date: 'Tue, 01 Jan 2024 00:00:00 GMT',
                digest: 'SHA-256=test',
            },
            signatureHeader,
        }, publicKey)).toEqual({
            valid: true,
            keyId: 'https://example.com/fed/actor/user-1#main-key',
        })
    })

    it('returns a structured error when required signature headers are missing', async () => {
        const { privateKey, publicKey } = await generateKeyPair()
        const signatureHeader = generateHTTPSignature({
            keyId: 'actor-key',
            method: 'GET',
            url: 'https://example.com/followers',
            headers: {
                host: 'example.com',
            },
            headerNames: ['host'],
        }, privateKey)

        expect(verifyHTTPSignature({
            method: 'GET',
            url: 'https://example.com/followers',
            headers: {},
            signatureHeader,
        }, publicKey)).toEqual({
            valid: false,
            error: 'Missing header: host',
        })
    })
})
