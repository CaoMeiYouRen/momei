import { describe, expect, it } from 'vitest'
import {
    getFallbackFragment,
    getBaseTemplateFallback,
    getEmailVerificationFallback,
    getCodeEmailFallback,
    getDefaultFallback,
    getFallbackMjmlTemplate,
    generateFallbackHtml,
} from './templates-fallback'

describe('email templates-fallback utils', () => {
    describe('getFallbackFragment', () => {
        it('should return verification-code fragment', () => {
            const fragment = getFallbackFragment('verification-code')
            expect(fragment).toContain('{{verificationCode}}')
            expect(fragment).toContain('{{verificationCodeExpiryText}}')
            expect(fragment).toContain('mj-section')
        })

        it('should return security-tip fragment', () => {
            const fragment = getFallbackFragment('security-tip')
            expect(fragment).toContain('{{securityTip}}')
            expect(fragment).toContain('{{securityTipTitle}}')
        })

        it('should return action-message fragment', () => {
            const fragment = getFallbackFragment('action-message')
            expect(fragment).toContain('{{message}}')
            expect(fragment).toContain('{{actionUrl}}')
            expect(fragment).toContain('{{buttonText}}')
        })

        it('should return important-reminder fragment', () => {
            const fragment = getFallbackFragment('important-reminder')
            expect(fragment).toContain('{{actionUrl}}')
            expect(fragment).toContain('{{reminderContent}}')
        })

        it('should return simple-message fragment', () => {
            const fragment = getFallbackFragment('simple-message')
            expect(fragment).toContain('{{message}}')
            expect(fragment).toContain('{{extraInfo}}')
        })

        it('should return default fragment for unknown name', () => {
            const fragment = getFallbackFragment('unknown-fragment')
            expect(fragment).toContain('{{message}}')
            expect(fragment).toContain('mj-section')
        })
    })

    describe('getBaseTemplateFallback', () => {
        it('should return base template with all placeholders', () => {
            const template = getBaseTemplateFallback()
            expect(template).toContain('{{title}}')
            expect(template).toContain('{{appName}}')
            expect(template).toContain('{{greeting}}')
            expect(template).toContain('{{mainContent}}')
            expect(template).toContain('{{currentYear}}')
            expect(template).toContain('<mjml>')
            expect(template).toContain('</mjml>')
        })

        it('should include header section', () => {
            const template = getBaseTemplateFallback()
            expect(template).toContain('{{headerSubtitle}}')
        })

        it('should include footer section', () => {
            const template = getBaseTemplateFallback()
            expect(template).toContain('{{helpText}}')
            expect(template).toContain('{{contactEmail}}')
            expect(template).toContain('{{footerNote}}')
        })
    })

    describe('getEmailVerificationFallback', () => {
        it('should return email verification template', () => {
            const template = getEmailVerificationFallback()
            expect(template).toContain('{{actionUrl}}')
            expect(template).toContain('{{buttonText}}')
            expect(template).toContain('{{reminderContent}}')
            expect(template).toContain('<mjml>')
        })

        it('should include alternative link section', () => {
            const template = getEmailVerificationFallback()
            expect(template).toContain('{{cannotClickButtonTitle}}')
        })
    })

    describe('getCodeEmailFallback', () => {
        it('should return code email template', () => {
            const template = getCodeEmailFallback()
            expect(template).toContain('{{verificationCode}}')
            expect(template).toContain('{{verificationCodeExpiryText}}')
            expect(template).toContain('{{securityTip}}')
            expect(template).toContain('<mjml>')
        })

        it('should include security tips section', () => {
            const template = getCodeEmailFallback()
            expect(template).toContain('{{securityTipTitle}}')
        })

        it('should include code highlight styling', () => {
            const template = getCodeEmailFallback()
            expect(template).toContain('code-highlight')
        })
    })

    describe('getDefaultFallback', () => {
        it('should return default template', () => {
            const template = getDefaultFallback()
            expect(template).toContain('{{title}}')
            expect(template).toContain('{{appName}}')
            expect(template).toContain('{{message}}')
            expect(template).toContain('{{currentYear}}')
            expect(template).toContain('<mjml>')
        })

        it('should be simpler than other templates', () => {
            const template = getDefaultFallback()
            expect(template.length).toBeLessThan(getBaseTemplateFallback().length)
        })
    })

    describe('getFallbackMjmlTemplate', () => {
        it('should return base-template', () => {
            const template = getFallbackMjmlTemplate('base-template')
            expect(template).toBe(getBaseTemplateFallback())
        })

        it('should return email-verification template', () => {
            const template = getFallbackMjmlTemplate('email-verification')
            expect(template).toBe(getEmailVerificationFallback())
        })

        it('should return action-email template', () => {
            const template = getFallbackMjmlTemplate('action-email')
            expect(template).toBe(getEmailVerificationFallback())
        })

        it('should return code-email template', () => {
            const template = getFallbackMjmlTemplate('code-email')
            expect(template).toBe(getCodeEmailFallback())
        })

        it('should return default template for unknown name', () => {
            const template = getFallbackMjmlTemplate('unknown-template')
            expect(template).toBe(getDefaultFallback())
        })
    })

    describe('generateFallbackHtml', () => {
        it('should generate HTML with basic data', () => {
            const html = generateFallbackHtml('Test Email', {
                appName: 'Test App',
                message: 'Test message',
                currentYear: '2024',
                contactEmail: 'test@example.com',
                baseUrl: 'https://example.com',
                footerNote: 'Test note',
            })

            expect(html).toContain('<!DOCTYPE html>')
            expect(html).toContain('Test App')
            expect(html).toContain('Test message')
            expect(html).toContain('2024')
        })

        it('should include verification code when provided', () => {
            const html = generateFallbackHtml('Test Email', {
                appName: 'Test App',
                message: 'Test message',
                verificationCode: '123456',
                expiresIn: '10',
                verificationCodeExpiryText: 'Use this code within {expiresIn} minutes',
                currentYear: '2024',
                contactEmail: 'test@example.com',
                baseUrl: 'https://example.com',
                footerNote: 'Test note',
            })

            expect(html).toContain('123456')
            expect(html).toContain('Use this code within 10 minutes')
        })

        it('should include action button when actionUrl provided', () => {
            const html = generateFallbackHtml('Test Email', {
                appName: 'Test App',
                message: 'Test message',
                actionUrl: 'https://example.com/verify',
                buttonText: 'Verify',
                cannotClickButtonTitle: 'Cannot click the button?',
                cannotClickButtonHint: 'Copy this URL into your browser:',
                currentYear: '2024',
                contactEmail: 'test@example.com',
                baseUrl: 'https://example.com',
                footerNote: 'Test note',
            })

            expect(html).toContain('https://example.com/verify')
            expect(html).toContain('Verify')
            expect(html).toContain('Cannot click the button?')
        })

        it('should include security tip when provided', () => {
            const html = generateFallbackHtml('Test Email', {
                appName: 'Test App',
                message: 'Test message',
                securityTip: 'Do not share this code',
                securityTipTitle: 'Security Tip',
                currentYear: '2024',
                contactEmail: 'test@example.com',
                baseUrl: 'https://example.com',
                footerNote: 'Test note',
            })

            expect(html).toContain('Security Tip')
            expect(html).toContain('Do not share this code')
        })

        it('should use default title when not provided', () => {
            const html = generateFallbackHtml('', {
                appName: 'Test App',
                message: 'Test message',
                currentYear: '2024',
                contactEmail: 'test@example.com',
                baseUrl: 'https://example.com',
                footerNote: 'Test note',
            })

            expect(html).toContain('<title>墨梅博客</title>')
        })

        it('should include footer links', () => {
            const html = generateFallbackHtml('Test Email', {
                appName: 'Test App',
                message: 'Test message',
                currentYear: '2024',
                contactEmail: 'test@example.com',
                baseUrl: 'https://example.com',
                contactLinkLabel: 'Contact',
                privacyPolicyLabel: 'Privacy Policy',
                termsLabel: 'Terms of Service',
                footerNote: 'Test note',
            })

            expect(html).toContain('Contact')
            expect(html).toContain('Privacy Policy')
            expect(html).toContain('Terms of Service')
            expect(html).toContain('https://example.com/privacy')
            expect(html).toContain('https://example.com/terms')
        })

        it('should include copyright and footer note', () => {
            const html = generateFallbackHtml('Test Email', {
                appName: 'Test App',
                message: 'Test message',
                currentYear: '2024',
                contactEmail: 'test@example.com',
                baseUrl: 'https://example.com',
                allRightsReserved: 'All rights reserved.',
                footerNote: 'Custom footer note',
            })

            expect(html).toContain('© 2024 Test App. All rights reserved.')
            expect(html).toContain('Custom footer note')
        })
    })
})
