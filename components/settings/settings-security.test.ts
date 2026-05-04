import { nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import SettingsSecurity from './settings-security.vue'

const {
    changePasswordMock,
    linkSocialMock,
    listAccountsMock,
    toastAddMock,
    unlinkAccountMock,
} = vi.hoisted(() => ({
    changePasswordMock: vi.fn(),
    linkSocialMock: vi.fn(),
    listAccountsMock: vi.fn(),
    toastAddMock: vi.fn(),
    unlinkAccountMock: vi.fn(),
}))

vi.mock('@/lib/auth-client', () => ({
    authClient: {
        listAccounts: listAccountsMock,
        unlinkAccount: unlinkAccountMock,
        linkSocial: linkSocialMock,
        changePassword: changePasswordMock,
    },
}))

mockNuxtImport('useI18n', () => () => ({
    t: (key: string) => key,
}))

mockNuxtImport('useLocalePath', () => () => (path: string) => path)
mockNuxtImport('useToast', () => () => ({ add: toastAddMock }))

const stubs = {
    Button: {
        props: ['label', 'type', 'loading', 'disabled'],
        emits: ['click'],
        template: `
            <button
                v-bind="$attrs"
                :type="type || 'button'"
                :data-loading="loading ? 'true' : 'false'"
                :disabled="disabled || loading"
                @click="$emit('click', $event)"
            >
                {{ label }}
                <slot />
            </button>
        `,
    },
    Password: {
        props: ['id', 'modelValue'],
        emits: ['update:modelValue'],
        template: `
            <input
                :id="id"
                type="password"
                :value="modelValue"
                @input="$emit('update:modelValue', $event.target.value)"
            >
        `,
    },
    Message: {
        template: '<div class="message-stub"><slot /></div>',
    },
    NuxtLink: {
        props: ['to'],
        template: '<a :href="to"><slot /></a>',
    },
    Divider: {
        template: '<hr>',
    },
}

async function mountComponent() {
    return mountSuspended(SettingsSecurity, {
        global: {
            stubs,
            mocks: {
                $t: (key: string) => key,
            },
        },
    })
}

describe('SettingsSecurity', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        listAccountsMock.mockResolvedValue({
            data: [
                { providerId: 'credential', accountId: 'password-only' },
                { providerId: 'github', accountId: 'gh-001' },
            ],
        })
        unlinkAccountMock.mockResolvedValue({ error: null })
        linkSocialMock.mockResolvedValue({ error: null })
        changePasswordMock.mockResolvedValue({ error: null })
    })

    it('loads linked accounts on mount and hides credential accounts', async () => {
        const wrapper = await mountComponent()

        await vi.waitFor(() => {
            expect(listAccountsMock).toHaveBeenCalledTimes(1)
        })

        expect(wrapper.text()).toContain('ID: gh-001')
        expect(wrapper.text()).not.toContain('password-only')
        expect(wrapper.text()).toContain('pages.settings.security.link_google')
    })

    it('shows a validation toast when password confirmation does not match', async () => {
        const wrapper = await mountComponent()

        await wrapper.get('#currentPassword').setValue('old-password')
        await wrapper.get('#newPassword').setValue('new-password')
        await wrapper.get('#confirmPassword').setValue('another-password')
        await wrapper.get('form').trigger('submit')

        expect(changePasswordMock).not.toHaveBeenCalled()
        expect(toastAddMock).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            detail: 'pages.register.password_mismatch',
        }))
    })

    it('updates the password and clears the form on success', async () => {
        const wrapper = await mountComponent()

        await wrapper.get('#currentPassword').setValue('old-password')
        await wrapper.get('#newPassword').setValue('new-password')
        await wrapper.get('#confirmPassword').setValue('new-password')
        await wrapper.get('form').trigger('submit')

        await vi.waitFor(() => {
            expect(changePasswordMock).toHaveBeenCalledWith({
                currentPassword: 'old-password',
                newPassword: 'new-password',
                revokeOtherSessions: true,
            })
        })

        expect(toastAddMock).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'success',
            detail: 'pages.settings.security.password_updated',
        }))
        expect((wrapper.get('#currentPassword').element as HTMLInputElement).value).toBe('')
        expect((wrapper.get('#newPassword').element as HTMLInputElement).value).toBe('')
        expect((wrapper.get('#confirmPassword').element as HTMLInputElement).value).toBe('')
    })

    it('shows the backend error when password update fails', async () => {
        changePasswordMock.mockResolvedValueOnce({
            error: {
                message: 'Current password is invalid',
                statusText: 'Bad Request',
            },
        })

        const wrapper = await mountComponent()

        await wrapper.get('#currentPassword').setValue('old-password')
        await wrapper.get('#newPassword').setValue('new-password')
        await wrapper.get('#confirmPassword').setValue('new-password')
        await wrapper.get('form').trigger('submit')

        await vi.waitFor(() => {
            expect(toastAddMock).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'error',
                detail: 'Current password is invalid',
            }))
        })
    })

    it('refetches accounts after unlink succeeds', async () => {
        listAccountsMock
            .mockResolvedValueOnce({
                data: [
                    { providerId: 'github', accountId: 'gh-001' },
                    { providerId: 'google', accountId: 'gg-001' },
                ],
            })
            .mockResolvedValueOnce({
                data: [
                    { providerId: 'google', accountId: 'gg-001' },
                ],
            })

        const wrapper = await mountComponent()

        await vi.waitFor(() => {
            expect(wrapper.text()).toContain('ID: gh-001')
        })

        const unlinkButtons = wrapper.findAll('button[aria-label="pages.settings.security.unlink_account"]')
        await unlinkButtons[0]?.trigger('click')

        await vi.waitFor(() => {
            expect(unlinkAccountMock).toHaveBeenCalledWith({ providerId: 'github' })
            expect(listAccountsMock).toHaveBeenCalledTimes(2)
        })

        expect(wrapper.text()).not.toContain('ID: gh-001')
        expect(wrapper.text()).toContain('ID: gg-001')
        expect(toastAddMock).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'success',
            detail: 'pages.settings.security.unlink_success',
        }))
    })

    it('shows an error toast when unlink fails', async () => {
        unlinkAccountMock.mockResolvedValueOnce({
            error: {
                message: 'Cannot unlink account',
                statusText: 'Bad Request',
            },
        })

        const wrapper = await mountComponent()

        await vi.waitFor(() => {
            expect(wrapper.text()).toContain('ID: gh-001')
        })

        const unlinkButtons = wrapper.findAll('button[aria-label="pages.settings.security.unlink_account"]')
        await unlinkButtons[0]?.trigger('click')

        await vi.waitFor(() => {
            expect(toastAddMock).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'error',
                detail: 'Cannot unlink account',
            }))
        })
    })

    it('keeps the provider in loading state after linkSocial starts successfully', async () => {
        const wrapper = await mountComponent()

        const googleLinkButton = wrapper.findAll('button').find((button) => button.text().includes('pages.settings.security.link_google'))
        await googleLinkButton?.trigger('click')
        await nextTick()

        expect(linkSocialMock).toHaveBeenCalledWith({
            provider: 'google',
            callbackURL: '/settings',
        })
        expect(googleLinkButton?.attributes('data-loading')).toBe('true')
    })

    it('shows an unexpected error toast when fetching linked accounts throws', async () => {
        const error = new Error('network down')
        listAccountsMock.mockRejectedValueOnce(error)
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

        await mountComponent()

        await vi.waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch linked accounts', error)
        })

        consoleErrorSpy.mockRestore()
    })
})
