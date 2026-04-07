import { describe, expect, it } from 'vitest'
import {
    getMissingPlaywrightBrowsers,
    getPlaywrightInstallAttempts,
    isRecoverablePlaywrightDepsInstallError,
} from '@/scripts/testing/run-e2e.mjs'

describe('run-e2e', () => {
    it('treats a complete playwright browser cache as reusable', () => {
        const installedDirs = [
            'chromium-1208',
            'chromium_headless_shell-1208',
            'ffmpeg-1011',
            'firefox-1509',
            'webkit-2248',
        ]

        expect(getMissingPlaywrightBrowsers(installedDirs)).toEqual([])
    })

    it('detects the missing chromium headless shell required by global setup', () => {
        const installedDirs = [
            'chromium-1208',
            'firefox-1509',
            'webkit-2248',
        ]

        expect(getMissingPlaywrightBrowsers(installedDirs)).toEqual(['chromium-headless-shell'])
    })

    it('fails closed when the browser cache is empty', () => {
        expect(getMissingPlaywrightBrowsers([])).toEqual([
            'chromium',
            'chromium-headless-shell',
            'firefox',
            'webkit',
        ])
    })

    it('retries without system deps by default on linux', () => {
        expect(getPlaywrightInstallAttempts({ env: {}, platform: 'linux' })).toEqual([
            ['install', '--with-deps'],
            ['install'],
        ])
    })

    it('uses plain install outside linux or when explicitly disabled', () => {
        expect(getPlaywrightInstallAttempts({ env: {}, platform: 'darwin' })).toEqual([
            ['install'],
        ])
        expect(getPlaywrightInstallAttempts({ env: { PLAYWRIGHT_INSTALL_DEPS: 'false' }, platform: 'linux' })).toEqual([
            ['install'],
        ])
    })

    it('keeps --with-deps when explicitly required', () => {
        expect(getPlaywrightInstallAttempts({ env: { PLAYWRIGHT_INSTALL_DEPS: 'true' }, platform: 'linux' })).toEqual([
            ['install', '--with-deps'],
        ])
    })

    it('recognizes recoverable apt-based install failures', () => {
        expect(isRecoverablePlaywrightDepsInstallError('E: The repository is not signed\nNO_PUBKEY 62D54FD4003F6525')).toBe(true)
        expect(isRecoverablePlaywrightDepsInstallError('Failed to install browsers\napt-get update failed')).toBe(true)
        expect(isRecoverablePlaywrightDepsInstallError('download timed out')).toBe(false)
    })
})
