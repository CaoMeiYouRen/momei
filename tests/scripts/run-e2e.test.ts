import { describe, expect, it } from 'vitest'
import { getMissingPlaywrightBrowsers } from '@/scripts/testing/run-e2e.mjs'

describe('run-e2e', () => {
    it('treats a complete playwright browser list as reusable', () => {
        const browserListOutput = [
            'Playwright version: 1.58.2',
            '  Browsers:',
            '    /home/runner/.cache/ms-playwright/chromium-1208',
            '    /home/runner/.cache/ms-playwright/chromium_headless_shell-1208',
            '    /home/runner/.cache/ms-playwright/ffmpeg-1011',
            '    /home/runner/.cache/ms-playwright/firefox-1509',
            '    /home/runner/.cache/ms-playwright/webkit-2248',
        ].join('\n')

        expect(getMissingPlaywrightBrowsers(browserListOutput)).toEqual([])
    })

    it('detects the missing chromium headless shell required by global setup', () => {
        const browserListOutput = [
            'Playwright version: 1.58.2',
            '  Browsers:',
            '    /home/runner/.cache/ms-playwright/chromium-1208',
            '    /home/runner/.cache/ms-playwright/firefox-1509',
            '    /home/runner/.cache/ms-playwright/webkit-2248',
        ].join('\n')

        expect(getMissingPlaywrightBrowsers(browserListOutput)).toEqual(['chromium-headless-shell'])
    })

    it('fails closed when the browser list cannot be parsed', () => {
        expect(getMissingPlaywrightBrowsers('')).toEqual([
            'chromium',
            'chromium-headless-shell',
            'firefox',
            'webkit',
        ])
    })
})
