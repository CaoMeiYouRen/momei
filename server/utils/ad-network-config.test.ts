import { describe, expect, it } from 'vitest'
import {
    normalizeAdapterConfig,
    parseCommercialConfig,
    resolveAdNetworkConfigs,
    resolveGoogleAdSenseAccount,
} from './ad-network-config'

describe('ad-network-config utils', () => {
    describe('parseCommercialConfig', () => {
        it('should return parsed config for valid json', () => {
            const result = parseCommercialConfig('{"enabled":true,"adsense":{"clientId":"ca-pub-1234567890123456"}}')

            expect(result).toMatchObject({
                enabled: true,
                adsense: {
                    clientId: 'ca-pub-1234567890123456',
                },
            })
        })

        it('should return empty object for invalid json', () => {
            expect(parseCommercialConfig('{invalid')).toEqual({})
        })
    })

    describe('normalizeAdapterConfig', () => {
        it('should keep enabled config', () => {
            expect(normalizeAdapterConfig({ clientId: 'ca-pub-1234567890123456' })).toEqual({
                clientId: 'ca-pub-1234567890123456',
            })
        })

        it('should ignore disabled config', () => {
            expect(normalizeAdapterConfig({ enabled: false, clientId: 'ca-pub-1234567890123456' })).toBeNull()
        })
    })

    describe('resolveAdNetworkConfigs', () => {
        it('should prefer nested adNetworks config', () => {
            const raw = JSON.stringify({
                adNetworks: {
                    adsense: {
                        clientId: 'ca-pub-1234567890123456',
                    },
                },
            })

            const result = resolveAdNetworkConfigs(raw)

            expect(result.adsense).toMatchObject({
                clientId: 'ca-pub-1234567890123456',
            })
        })

        it('should fallback to env config', () => {
            const result = resolveAdNetworkConfigs(null, {
                ADSENSE_CLIENT_ID: 'ca-pub-9999999999999999',
            })

            expect(result.adsense).toMatchObject({
                clientId: 'ca-pub-9999999999999999',
            })
        })
    })

    describe('resolveGoogleAdSenseAccount', () => {
        it('should resolve adsense client id from config', () => {
            const raw = JSON.stringify({
                adsense: {
                    clientId: 'ca-pub-1234567890123456',
                },
            })

            expect(resolveGoogleAdSenseAccount(raw)).toBe('ca-pub-1234567890123456')
        })

        it('should return null when account is unavailable', () => {
            expect(resolveGoogleAdSenseAccount(null, {})).toBeNull()
        })
    })
})
