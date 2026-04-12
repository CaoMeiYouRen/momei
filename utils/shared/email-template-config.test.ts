import { describe, it, expect } from 'vitest'
import {
    createEmptyEmailTemplateSettingsConfig,
    parseEmailTemplateSettingsConfig,
    getEmailTemplateCustomConfig,
    updateEmailTemplateCustomConfig,
    resolveEmailTemplateLocalizedField,
    EMAIL_TEMPLATE_IDS,
    EMAIL_TEMPLATE_FIELD_IDS,
    EMAIL_TEMPLATE_DEFINITIONS,
} from './email-template-config'

describe('createEmptyEmailTemplateSettingsConfig', () => {
    it('returns version 1 with empty templates', () => {
        const config = createEmptyEmailTemplateSettingsConfig()
        expect(config.version).toBe(1)
        expect(config.templates).toEqual({})
    })
})

describe('EMAIL_TEMPLATE_IDS and EMAIL_TEMPLATE_DEFINITIONS', () => {
    it('EMAIL_TEMPLATE_IDS contains verification', () => {
        expect(EMAIL_TEMPLATE_IDS).toContain('verification')
    })

    it('every id has a definition', () => {
        for (const id of EMAIL_TEMPLATE_IDS) {
            expect(EMAIL_TEMPLATE_DEFINITIONS[id]).toBeDefined()
        }
    })

    it('every definition has required fields', () => {
        for (const def of Object.values(EMAIL_TEMPLATE_DEFINITIONS)) {
            expect(def.id).toBeTruthy()
            expect(def.kind).toBeTruthy()
            expect(Array.isArray(def.editableFields)).toBe(true)
            expect(Array.isArray(def.variables)).toBe(true)
        }
    })
})

describe('parseEmailTemplateSettingsConfig', () => {
    it('returns empty config for null', () => {
        const result = parseEmailTemplateSettingsConfig(null)
        expect(result).toEqual({ version: 1, templates: {} })
    })

    it('returns empty config for empty string', () => {
        const result = parseEmailTemplateSettingsConfig('')
        expect(result).toEqual({ version: 1, templates: {} })
    })

    it('returns empty config for invalid JSON string', () => {
        const result = parseEmailTemplateSettingsConfig('not json')
        expect(result).toEqual({ version: 1, templates: {} })
    })

    it('parses valid JSON string config', () => {
        const config = {
            version: 1,
            templates: {
                verification: { enabled: true, fields: {} },
            },
        }
        const result = parseEmailTemplateSettingsConfig(JSON.stringify(config))
        expect(result.version).toBe(1)
        expect(result.templates.verification).toBeDefined()
        expect(result.templates.verification?.enabled).toBe(true)
    })

    it('parses object config directly', () => {
        const config = {
            version: 1,
            templates: {
                loginOTP: { enabled: false, fields: {} },
            },
        }
        const result = parseEmailTemplateSettingsConfig(config)
        expect(result.templates.loginOTP).toBeDefined()
    })

    it('skips unknown template ids', () => {
        const config = {
            version: 1,
            templates: {
                unknownTemplate: { enabled: true },
            },
        }
        const result = parseEmailTemplateSettingsConfig(config)
        expect(Object.keys(result.templates)).toHaveLength(0)
    })

    it('parses template with legacy string field', () => {
        const config = {
            version: 1,
            templates: {
                verification: {
                    enabled: true,
                    fields: {
                        title: 'My Custom Title',
                    },
                },
            },
        }
        const result = parseEmailTemplateSettingsConfig(config)
        expect(result.templates.verification?.fields?.title).toBeDefined()
    })
})

describe('getEmailTemplateCustomConfig', () => {
    it('returns empty object for unknown template', () => {
        const result = getEmailTemplateCustomConfig(null, 'verification')
        expect(result).toEqual({})
    })

    it('returns existing template config', () => {
        const config = {
            version: 1 as const,
            templates: {
                verification: { enabled: true, fields: {} },
            },
        }
        const result = getEmailTemplateCustomConfig(config, 'verification')
        expect(result.enabled).toBe(true)
    })
})

describe('updateEmailTemplateCustomConfig', () => {
    it('creates new config from null with template', () => {
        const result = updateEmailTemplateCustomConfig(null, 'loginOTP', { enabled: true })
        expect(result.templates.loginOTP?.enabled).toBe(true)
        expect(result.version).toBe(1)
    })

    it('updates existing template', () => {
        const existing = {
            version: 1 as const,
            templates: {
                verification: { enabled: true },
            },
        }
        const result = updateEmailTemplateCustomConfig(existing, 'verification', { enabled: false })
        expect(result.templates.verification?.enabled).toBe(false)
    })

    it('preserves other templates', () => {
        const existing = {
            version: 1 as const,
            templates: {
                verification: { enabled: true },
                loginOTP: { enabled: true },
            },
        }
        const result = updateEmailTemplateCustomConfig(existing, 'loginOTP', { enabled: false })
        expect(result.templates.verification?.enabled).toBe(true)
        expect(result.templates.loginOTP?.enabled).toBe(false)
    })
})

describe('resolveEmailTemplateLocalizedField', () => {
    it('returns null for null value', () => {
        const result = resolveEmailTemplateLocalizedField(null, 'zh-CN')
        expect(result.value).toBeNull()
        expect(result.resolvedLocale).toBeNull()
    })

    it('returns null for undefined value', () => {
        const result = resolveEmailTemplateLocalizedField(undefined)
        expect(result.value).toBeNull()
        expect(result.usedFallback).toBe(false)
    })

    it('resolves localized field for exact locale match', () => {
        const localizedField = {
            type: 'localized-text' as const,
            version: 1 as const,
            locales: { 'zh-CN': 'Chinese title' },
        }
        const result = resolveEmailTemplateLocalizedField(localizedField, 'zh-CN')
        expect(result.value).toBe('Chinese title')
        expect(result.usedFallback).toBe(false)
    })

    it('falls back to legacy value when no locale matches', () => {
        const localizedField = {
            type: 'localized-text' as const,
            version: 1 as const,
            locales: {},
            legacyValue: 'Legacy Title',
        }
        const result = resolveEmailTemplateLocalizedField(localizedField, 'zh-CN')
        expect(result.value).toBe('Legacy Title')
        expect(result.resolvedLocale).toBe('legacy')
        expect(result.usedFallback).toBe(true)
    })

    it('returns null value when nothing resolves', () => {
        const localizedField = {
            type: 'localized-text' as const,
            version: 1 as const,
            locales: {},
        }
        const result = resolveEmailTemplateLocalizedField(localizedField, 'zh-CN')
        expect(result.value).toBeNull()
    })
})
