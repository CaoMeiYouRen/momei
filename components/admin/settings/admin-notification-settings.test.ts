import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { createLegacyToastApi } from '@/tests/helpers/caomei-service-mocks'
import { settleUi } from '@/tests/helpers/ui-interaction'

const {
    appFetchMock,
    toastAddMock,
    openFeedbackEntryMock,
    unsavedChangesGuardMock,
} = vi.hoisted(() => ({
    appFetchMock: vi.fn(),
    toastAddMock: vi.fn(),
    openFeedbackEntryMock: vi.fn(),
    unsavedChangesGuardMock: vi.fn(),
}))

mockNuxtImport('useI18n', () => () => ({
    t: (key: string) => key,
}))

mockNuxtImport('useAppApi', () => () => ({
    $appFetch: appFetchMock,
}))

vi.mock('caomei-ui', async (importOriginal) => {
    const actual = await importOriginal<typeof import('caomei-ui')>()

    return {
        ...actual,
        useToast: () => createLegacyToastApi(toastAddMock),
    }
})

vi.mock('@/composables/use-feedback-entry', () => ({
    useFeedbackEntry: () => ({
        openFeedbackEntry: openFeedbackEntryMock,
        shouldShowFeedbackEntry: true,
    }),
}))

vi.mock('@/composables/use-unsaved-changes-guard', () => ({
    useUnsavedChangesGuard: unsavedChangesGuardMock,
}))

const stubs = {
    CaomeiMessage: {
        props: ['tone', 'closable'],
        template: '<div class="message-stub" :data-tone="tone"><slot /></div>',
    },
    CaomeiSwitch: {
        props: ['modelValue'],
        emits: ['update:modelValue'],
        template: '<input class="toggle-switch-stub" type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
    },
    CaomeiTag: {
        props: ['tone'],
        template: '<span class="tag-stub" :data-tone="tone"><slot /></span>',
    },
    CaomeiDataTable: {
        props: ['data', 'columns'],
        template: `
            <div class="table-stub">
                <div v-for="row in data" :key="row.event" class="row-stub" :data-event="row.event">
                    <span class="cell-event"><slot name="cell-event" :row="row" /></span>
                    <span class="cell-email"><slot name="cell-isEmailEnabled" :row="row" /></span>
                    <span class="cell-browser"><slot name="cell-isBrowserEnabled" :row="row" /></span>
                </div>
            </div>
        `,
    },
    SettingFormField: {
        props: ['fieldKey', 'inputId', 'metadata'],
        template: '<div class="setting-field" :data-field-key="fieldKey"><slot /></div>',
    },
    SettingInput: {
        props: ['id', 'modelValue', 'disabled'],
        emits: ['update:modelValue'],
        template: '<input :id="id" class="setting-input-stub" :value="modelValue" :disabled="disabled" @input="$emit(\'update:modelValue\', $event.target.value)">',
    },
    SettingTextarea: {
        props: ['id', 'modelValue', 'disabled', 'rows', 'autoResize'],
        emits: ['update:modelValue'],
        template: '<textarea :id="id" class="setting-textarea-stub" :value="modelValue" :disabled="disabled" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    },
    AdminFloatingActions: {
        props: ['primaryLabel', 'primaryLoading', 'primaryDisabled', 'secondaryLabel', 'statusLabel', 'statusTone'],
        emits: ['primary-click', 'secondary-click'],
        template: `
            <div class="floating-actions-stub" :data-status-tone="statusTone" :data-primary-disabled="String(primaryDisabled)">
                <span class="status-label">{{ statusLabel }}</span>
                <button class="primary-action" type="button" @click="$emit('primary-click')">{{ primaryLabel }}</button>
                <button class="secondary-action" type="button" @click="$emit('secondary-click')">{{ secondaryLabel }}</button>
            </div>
        `,
    },
}

interface AdminNotificationWebPushState {
    subject: AdminNotificationWebPushField
    publicKey: AdminNotificationWebPushField
    privateKeyConfigured: boolean
    isConfigured: boolean
}

interface AdminNotificationWebPushField {
    value: string
    source: string
    isLocked: boolean
    envKey: string | null
    defaultUsed: boolean
    lockReason: string | null
    requiresRestart: boolean
}

function createWebPushState(overrides: Partial<AdminNotificationWebPushState> = {}): AdminNotificationWebPushState {
    return {
        subject: {
            value: 'mailto:admin@example.com',
            source: 'db',
            isLocked: false,
            envKey: null,
            defaultUsed: false,
            lockReason: null,
            requiresRestart: false,
        },
        publicKey: {
            value: 'public-key',
            source: 'db',
            isLocked: true,
            envKey: 'WEB_PUSH_PUBLIC_KEY',
            defaultUsed: false,
            lockReason: 'env',
            requiresRestart: false,
        },
        privateKeyConfigured: true,
        isConfigured: true,
        ...overrides,
    }
}

function notificationPayload(overrides: Record<string, unknown> = {}) {
    return {
        code: 200,
        data: {
            items: [
                { event: 'comment', isEmailEnabled: true, isBrowserEnabled: false },
                { event: 'system', isEmailEnabled: false, isBrowserEnabled: true },
            ],
            demoPreview: true,
            webPush: createWebPushState(),
            ...overrides,
        },
    }
}

async function mountComponent() {
    const { default: AdminNotificationSettings } = await import('./admin-notification-settings.vue')

    const wrapper = await mountSuspended(AdminNotificationSettings, {
        global: {
            stubs,
            mocks: {
                $t: (key: string) => key,
            },
        },
    })
    await settleUi()

    return wrapper
}

describe('AdminNotificationSettings', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        appFetchMock.mockReset()
        appFetchMock.mockResolvedValue(notificationPayload())
    })

    it('loads notification settings and web push state on mount', async () => {
        const wrapper = await mountComponent()

        expect(appFetchMock).toHaveBeenCalledWith('/api/admin/settings/notifications/admin')
        expect(wrapper.findAll('.row-stub')).toHaveLength(2)
        expect(wrapper.find('.cell-event').text()).toBe('pages.admin.settings.system.notifications.events.comment')
        expect(wrapper.findAll('.toggle-switch-stub')).toHaveLength(4)
        expect(wrapper.find('.admin-notifications__status-message').attributes('data-tone')).toBe('success')
        expect(wrapper.find('.tag-stub').attributes('data-tone')).toBe('success')
        expect(wrapper.find('.admin-notifications__status-copy').text()).toContain('private_key_ready')
        expect(wrapper.find('.message-stub').exists()).toBe(true)
        expect(wrapper.find('.floating-actions-stub').attributes('data-status-tone')).toBe('success')
        expect(wrapper.find('.status-label').text()).toBe('pages.admin.settings.system.floating_actions.saved')
        expect(wrapper.find('.floating-actions-stub').attributes('data-primary-disabled')).toBe('true')
        const guardOptions = unsavedChangesGuardMock.mock.calls[0]?.[0] as {
            isDirty: { value: boolean }
            message: { value: string }
        }
        expect(guardOptions.isDirty.value).toBe(false)
        expect(guardOptions.message.value).toBe('pages.admin.settings.system.floating_actions.leave_confirm')
    })

    it('renders the incomplete web push state when keys are missing', async () => {
        appFetchMock.mockResolvedValue(notificationPayload({
            webPush: createWebPushState({
                privateKeyConfigured: false,
                isConfigured: false,
            }),
        }))

        const wrapper = await mountComponent()

        expect(wrapper.find('.tag-stub').attributes('data-tone')).toBe('warning')
        expect(wrapper.find('.admin-notifications__status-message').attributes('data-tone')).toBe('warning')
        expect(wrapper.find('.admin-notifications__status-copy').text()).toContain('private_key_missing')
    })

    it('falls back to the default web push state when the payload omits it', async () => {
        appFetchMock.mockResolvedValue({ code: 200, data: { items: [] } })

        const wrapper = await mountComponent()

        expect(wrapper.find('.admin-notifications__section-title').text()).toBe('pages.admin.settings.system.notifications.web_push.title')
        expect(wrapper.find('.admin-notifications__status-message').attributes('data-tone')).toBe('warning')
        expect(wrapper.find('.setting-input-stub').attributes('value')).toBe('')
        expect(wrapper.find('.setting-textarea-stub').attributes('value')).toBe('')
        expect(wrapper.find('.floating-actions-stub').attributes('data-status-tone')).toBe('success')
    })

    it('tracks dirty state and saves notification settings', async () => {
        const wrapper = await mountComponent()

        await wrapper.findAll('.toggle-switch-stub')[1]!.setValue(true)
        await settleUi()

        expect(wrapper.find('.floating-actions-stub').attributes('data-status-tone')).toBe('warn')
        expect(wrapper.find('.status-label').text()).toBe('pages.admin.settings.system.floating_actions.unsaved')
        expect(wrapper.find('.floating-actions-stub').attributes('data-primary-disabled')).toBe('false')
        expect((unsavedChangesGuardMock.mock.calls[0]?.[0] as { isDirty: { value: boolean } }).isDirty.value).toBe(true)

        appFetchMock.mockClear()
        await wrapper.find('.primary-action').trigger('click')
        await settleUi()

        expect(appFetchMock).toHaveBeenNthCalledWith(1, '/api/admin/settings/notifications/admin', {
            method: 'PUT',
            body: {
                items: [
                    { event: 'comment', isEmailEnabled: true, isBrowserEnabled: true },
                    { event: 'system', isEmailEnabled: false, isBrowserEnabled: true },
                ],
                webPush: {
                    subject: 'mailto:admin@example.com',
                    publicKey: 'public-key',
                },
            },
        })
        // 保存成功后会重新拉取并重置快照
        expect(appFetchMock).toHaveBeenNthCalledWith(2, '/api/admin/settings/notifications/admin')
        expect(toastAddMock).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'success',
            detail: 'common.save_success',
        }))
        expect(wrapper.find('.floating-actions-stub').attributes('data-status-tone')).toBe('success')
    })

    it('does nothing when saving without local changes', async () => {
        const wrapper = await mountComponent()
        appFetchMock.mockClear()

        await wrapper.find('.primary-action').trigger('click')
        await settleUi()

        expect(appFetchMock).not.toHaveBeenCalled()
        expect(toastAddMock).not.toHaveBeenCalled()
    })

    it('updates web push text fields and flags them dirty', async () => {
        const baseWebPush = createWebPushState()
        appFetchMock.mockResolvedValue(notificationPayload({
            webPush: {
                ...baseWebPush,
                publicKey: { ...baseWebPush.publicKey, isLocked: false, envKey: null, lockReason: null },
            },
        }))
        const wrapper = await mountComponent()

        await wrapper.find('.setting-input-stub').setValue('mailto:new@example.com')
        await wrapper.find('.setting-textarea-stub').setValue('new-public-key')
        await settleUi()

        expect(wrapper.find('.floating-actions-stub').attributes('data-status-tone')).toBe('warn')

        appFetchMock.mockClear()
        await wrapper.find('.primary-action').trigger('click')
        await settleUi()

        expect(appFetchMock).toHaveBeenNthCalledWith(1, '/api/admin/settings/notifications/admin', expect.objectContaining({
            body: expect.objectContaining({
                webPush: {
                    subject: 'mailto:new@example.com',
                    publicKey: 'new-public-key',
                },
            }),
        }))
    })

    it('opens the feedback entry from the secondary action', async () => {
        const wrapper = await mountComponent()

        await wrapper.find('.secondary-action').trigger('click')

        expect(openFeedbackEntryMock).toHaveBeenCalledTimes(1)
    })

    it('shows a danger toast when loading fails', async () => {
        const error = new Error('boom') as Error & { data?: { message?: string } }
        error.data = { message: '通知设置加载失败' }
        appFetchMock.mockRejectedValue(error)

        const wrapper = await mountComponent()

        expect(toastAddMock).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            detail: '通知设置加载失败',
        }))
        expect(wrapper.findAll('.row-stub')).toHaveLength(0)
    })

    it('shows a danger toast when saving fails and keeps the dirty state', async () => {
        const wrapper = await mountComponent()
        const error = new Error('boom') as Error & { data?: { message?: string } }
        error.data = { message: '通知设置保存失败' }
        appFetchMock.mockRejectedValueOnce(error)

        await wrapper.findAll('.toggle-switch-stub')[1]!.setValue(true)
        await settleUi()
        await wrapper.find('.primary-action').trigger('click')
        await settleUi()

        expect(toastAddMock).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            detail: '通知设置保存失败',
        }))
        expect(wrapper.find('.floating-actions-stub').attributes('data-status-tone')).toBe('warn')
    })

})
