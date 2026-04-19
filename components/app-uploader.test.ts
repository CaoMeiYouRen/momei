import { defineComponent } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AppUploader from './app-uploader.vue'

const { uploadFileMock, uploadingRef } = vi.hoisted(() => ({
    uploadFileMock: vi.fn(),
    uploadingRef: { __v_isRef: true, value: false },
}))

vi.mock('@/composables/use-upload', () => ({
    UploadType: {
        IMAGE: 'image',
    },
    useUpload: () => ({
        uploading: uploadingRef,
        uploadFile: uploadFileMock,
    }),
}))

const InputGroupStub = defineComponent({
    template: '<div class="input-group"><slot /></div>',
})

const InputTextStub = defineComponent({
    props: {
        modelValue: { type: String, default: '' },
    },
    emits: ['update:modelValue'],
    template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)">',
})

const ButtonStub = defineComponent({
    inheritAttrs: false,
    emits: ['click'],
    template: '<button type="button" v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>',
})

function createFileList(files: File[]) {
    return {
        '0': files[0],
        length: files.length,
        item: (index: number) => files[index] ?? null,
    }
}

describe('AppUploader', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        uploadFileMock.mockReset()
        uploadingRef.value = false
    })

    it('opens the hidden file input when the upload button is clicked', async () => {
        const wrapper = await mountSuspended(AppUploader, {
            props: {
                modelValue: '',
            },
            global: {
                stubs: {
                    InputGroup: InputGroupStub,
                    InputText: InputTextStub,
                    Button: ButtonStub,
                },
            },
        })

        const fileInput = wrapper.find('input[type="file"]').element as HTMLInputElement
        const clickSpy = vi.spyOn(fileInput, 'click').mockImplementation(() => {})

        await wrapper.find('button').trigger('click')

        expect(clickSpy).toHaveBeenCalledTimes(1)
    })

    it('uploads the selected file, updates model value and resets the input', async () => {
        uploadFileMock.mockResolvedValueOnce('https://assets.example.com/image.png')

        const wrapper = await mountSuspended(AppUploader, {
            props: {
                modelValue: '',
                postId: 'post-1',
                type: 'image',
            },
            global: {
                stubs: {
                    InputGroup: InputGroupStub,
                    InputText: InputTextStub,
                    Button: ButtonStub,
                },
            },
        })

        const fileInput = wrapper.find('input[type="file"]').element as HTMLInputElement
        Object.defineProperty(fileInput, 'files', {
            configurable: true,
            value: createFileList([
                new File(['image'], 'image.png', { type: 'image/png' }),
            ]),
        })

        await wrapper.find('input[type="file"]').trigger('change')

        expect(uploadFileMock).toHaveBeenCalledTimes(1)
        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['https://assets.example.com/image.png'])
        expect(fileInput.value).toBe('')
    })

    it('tracks drag state and uploads dropped files', async () => {
        uploadFileMock.mockResolvedValueOnce('https://assets.example.com/dropped.png')

        const wrapper = await mountSuspended(AppUploader, {
            props: {
                modelValue: '',
            },
            global: {
                stubs: {
                    InputGroup: InputGroupStub,
                    InputText: InputTextStub,
                    Button: ButtonStub,
                },
            },
        })

        await wrapper.find('.app-uploader').trigger('dragover', {
            dataTransfer: { types: ['Files'] },
        })
        expect(wrapper.classes()).toContain('app-uploader--dragging')

        await wrapper.find('.app-uploader').trigger('drop', {
            dataTransfer: {
                files: createFileList([
                    new File(['image'], 'dropped.png', { type: 'image/png' }),
                ]),
            },
        })

        expect(uploadFileMock).toHaveBeenCalledTimes(1)
        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['https://assets.example.com/dropped.png'])
        expect(wrapper.classes()).not.toContain('app-uploader--dragging')
    })

    it('ignores drag and drop interactions while disabled or uploading', async () => {
        uploadingRef.value = true

        const wrapper = await mountSuspended(AppUploader, {
            props: {
                modelValue: '',
                disabled: true,
            },
            global: {
                stubs: {
                    InputGroup: InputGroupStub,
                    InputText: InputTextStub,
                    Button: ButtonStub,
                },
            },
        })

        await wrapper.find('.app-uploader').trigger('dragover', {
            dataTransfer: { types: ['Files'] },
        })
        await wrapper.find('.app-uploader').trigger('drop', {
            dataTransfer: {
                files: createFileList([
                    new File(['image'], 'blocked.png', { type: 'image/png' }),
                ]),
            },
        })

        expect(wrapper.classes()).not.toContain('app-uploader--dragging')
        expect(uploadFileMock).not.toHaveBeenCalled()
    })
})
