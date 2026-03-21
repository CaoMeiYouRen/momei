import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import SettingsProfile from './settings-profile.vue'

const mockSession = ref({
    data: {
        user: {
            name: 'Tester',
            image: '',
            email: 'tester@momei.dev',
            language: 'zh-CN',
            timezone: 'UTC',
        },
    },
})

const { mockInvalidateAuthSessionState, mockRefreshAuthSession, mockUpdateUser, mockToastAdd, mockSetLocale } = vi.hoisted(() => ({
    mockInvalidateAuthSessionState: vi.fn(),
    mockRefreshAuthSession: vi.fn().mockResolvedValue(undefined),
    mockUpdateUser: vi.fn().mockResolvedValue({ error: null }),
    mockToastAdd: vi.fn(),
    mockSetLocale: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/composables/use-auth-session', () => ({
    invalidateAuthSessionState: mockInvalidateAuthSessionState,
    refreshAuthSession: mockRefreshAuthSession,
}))

vi.mock('@/lib/auth-client', () => ({
    authClient: {
        useSession: vi.fn(() => mockSession),
        updateUser: mockUpdateUser,
    },
}))

mockNuxtImport('useI18n', () => () => ({
    t: (key: string) => key,
    locales: ref(['zh-CN', 'en-US']),
    setLocale: mockSetLocale,
}))

mockNuxtImport('useToast', () => () => ({
    add: mockToastAdd,
}))

vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({
    code: 200,
    data: { url: 'https://cdn.momei.dev/avatar.png' },
}))

const stubs = {
    AppAvatar: { template: '<div class="avatar-preview" />' },
    InputText: {
        template: '<input :id="id" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
        props: ['id', 'modelValue'],
    },
    Select: {
        template: '<select :id="id" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="option in options" :key="option[optionValue]" :value="option[optionValue]">{{ option[optionLabel] }}</option></select>',
        props: ['id', 'modelValue', 'options', 'optionLabel', 'optionValue'],
    },
    FileUpload: {
        name: 'FileUpload',
        emits: ['uploader'],
        template: '<div class="avatar-upload-trigger" />',
    },
    Button: {
        template: '<button :type="type" @click="$emit(\'click\')">{{ label }}</button>',
        props: ['type', 'label', 'loading'],
    },
}

describe('SettingsProfile', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockSession.value = {
            data: {
                user: {
                    name: 'Tester',
                    image: '',
                    email: 'tester@momei.dev',
                    language: 'zh-CN',
                    timezone: 'UTC',
                },
            },
        }
    })

    it('should invalidate and refresh session after avatar upload', async () => {
        const wrapper = await mountSuspended(SettingsProfile, {
            global: { stubs },
        })

        wrapper.findComponent({ name: 'FileUpload' }).vm.$emit('uploader', {
            files: [new Blob(['avatar'], { type: 'image/png' })],
        })
        await wrapper.vm.$nextTick()

        expect(mockInvalidateAuthSessionState).toHaveBeenCalledTimes(1)
        expect(mockRefreshAuthSession).toHaveBeenCalledTimes(1)
    })

    it('should invalidate and refresh session after profile update', async () => {
        const wrapper = await mountSuspended(SettingsProfile, {
            global: { stubs },
        })

        await wrapper.find('input#name').setValue('Updated User')
        await wrapper.find('form').trigger('submit.prevent')

        expect(mockInvalidateAuthSessionState).toHaveBeenCalledTimes(1)
        expect(mockUpdateUser).toHaveBeenCalledWith(expect.objectContaining({
            name: 'Updated User',
        }), {
            disableSignal: true,
        })
        expect(mockRefreshAuthSession).toHaveBeenCalledTimes(1)
    })

    it('should restore session state when profile update fails', async () => {
        mockUpdateUser.mockResolvedValueOnce({
            error: {
                message: 'Update failed',
                statusText: 'Bad Request',
            },
        })

        const wrapper = await mountSuspended(SettingsProfile, {
            global: { stubs },
        })

        await wrapper.find('input#name').setValue('Broken User')
        await wrapper.find('form').trigger('submit.prevent')

        expect(mockInvalidateAuthSessionState).toHaveBeenCalledTimes(1)
        expect(mockRefreshAuthSession).toHaveBeenCalledTimes(1)
        expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
        }))
    })
})
