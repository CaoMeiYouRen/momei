import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import SetupFollowUpCard from './setup-follow-up-card.vue'

const stubs = {
    Card: { template: '<section class="card"><slot name="content" /></section>' },
    Button: {
        props: ['label'],
        emits: ['click'],
        template: '<button type="button" @click="$emit(\'click\')">{{ label }}</button>',
    },
}

describe('SetupFollowUpCard', () => {
    it('renders the suggested tabs and emits their tab ids when chips are clicked', async () => {
        const wrapper = await mountSuspended(SetupFollowUpCard, {
            global: {
                stubs,
                mocks: {
                    $t: (key: string) => key,
                },
            },
        })

        const chipButtons = wrapper.findAll('.setup-follow-up-card__chip')
        expect(chipButtons).toHaveLength(4)

        await chipButtons[0]?.trigger('click')
        await chipButtons[1]?.trigger('click')
        await chipButtons[2]?.trigger('click')
        await chipButtons[3]?.trigger('click')

        expect(wrapper.emitted('open-tab')).toEqual([
            ['auth'],
            ['notifications'],
            ['ai'],
            ['storage'],
        ])
    })

    it('emits continue-editor and dismiss actions from the footer buttons', async () => {
        const wrapper = await mountSuspended(SetupFollowUpCard, {
            global: {
                stubs,
                mocks: {
                    $t: (key: string) => key,
                },
            },
        })

        const actionButtons = wrapper.findAll('.setup-follow-up-card__actions button')
        await actionButtons[0]?.trigger('click')
        await actionButtons[1]?.trigger('click')

        expect(wrapper.emitted('continue-editor')).toHaveLength(1)
        expect(wrapper.emitted('dismiss')).toHaveLength(1)
    })
})
