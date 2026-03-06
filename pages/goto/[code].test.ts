import { beforeEach, describe, expect, it } from 'vitest'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import GotoPage from './[code].vue'

const stubs = {
    Button: {
        props: ['label'],
        template: '<button>{{ label }}<slot /></button>',
    },
    ProgressSpinner: {
        template: '<div class="progress-spinner" />',
    },
}

describe('pages/goto/[code].vue', () => {
    beforeEach(() => {
        registerEndpoint('/api/goto/test-code', () => ({
            code: 200,
            message: 'Success',
            data: {
                url: 'https://example.com/redirect-target',
                favicon: '',
                title: 'Example',
                showRedirectPage: true,
            },
        }))

        registerEndpoint('/api/goto/missing-code', () => ({
            code: 404,
            message: 'Link not found',
        }))
    })

    it('should render redirect target from api response data', async () => {
        const wrapper = await mountSuspended(GotoPage, {
            route: '/goto/test-code',
            global: {
                stubs,
            },
        })

        expect(wrapper.text()).toContain('https://example.com/redirect-target')
        expect(wrapper.text()).toContain('您即将离开本站')

        wrapper.unmount()
    })

    it('should render error state when api returns non-200 response', async () => {
        const wrapper = await mountSuspended(GotoPage, {
            route: '/goto/missing-code',
            global: {
                stubs,
            },
        })

        expect(wrapper.text()).toContain('链接不可用')
        expect(wrapper.text()).toContain('请求的链接不存在或已被禁用。')

        wrapper.unmount()
    })
})
