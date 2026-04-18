import { beforeEach, describe, expect, it, vi } from 'vitest'
import { copyRenderedMarkdownCode, initRenderedMarkdownCodeGroups } from './rendered-markdown'

describe('rendered-markdown', () => {
    beforeEach(() => {
        document.body.innerHTML = ''
    })

    it('initializes code groups only once and activates the first tab', () => {
        document.body.innerHTML = `
            <div id="root">
                <div class="code-group">
                    <pre data-title="TypeScript"><code class="language-ts">const a = 1</code></pre>
                    <pre data-title="JavaScript"><code class="language-js">const b = 2</code></pre>
                </div>
            </div>
        `

        const root = document.getElementById('root')
        initRenderedMarkdownCodeGroups(root)
        initRenderedMarkdownCodeGroups(root)

        expect(root?.querySelectorAll('.code-group-tabs button')).toHaveLength(2)
        expect(root?.querySelectorAll('.code-group-content pre.active')).toHaveLength(1)
        expect(root?.querySelector('.code-group-tabs button.active')?.textContent).toBe('TypeScript')
    })

    it('copies code blocks through the shared preview helper', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined)
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText },
        })

        document.body.innerHTML = `
            <pre>
                <div class="copy-code-wrapper">
                    <button class="copy-code-button" type="button"></button>
                </div>
                <code>const value = 1</code>
            </pre>
        `

        const button = document.querySelector('.copy-code-button') as HTMLElement
        const copied = await copyRenderedMarkdownCode(button)

        expect(copied).toBe(true)
        expect(writeText).toHaveBeenCalledWith('const value = 1')
        expect(button.classList.contains('copied')).toBe(true)
    })
})
