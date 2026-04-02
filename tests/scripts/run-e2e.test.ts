import { describe, expect, it } from 'vitest'
import { getMissingPlaywrightBrowsers } from '@/scripts/testing/run-e2e.mjs'

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
})
