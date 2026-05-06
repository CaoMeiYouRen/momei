import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { defineComponent, reactive, ref, type PropType } from 'vue'

const {
    mockAppFetch,
    showSuccessToast,
    showErrorToast,
} = vi.hoisted(() => ({
    mockAppFetch: vi.fn().mockResolvedValue({
        data: {
            refreshedAt: '2026-05-05T00:00:00.000Z',
            sourceCount: 2,
            snapshotCount: 3,
            failureCount: 0,
        },
    }),
    showSuccessToast: vi.fn(),
    showErrorToast: vi.fn(),
}))

const translations: Record<string, string> = {
    'pages.admin.settings.system.sections.memos': 'Memos',
    'pages.admin.settings.system.sections.listmonk': 'listmonk',
    'pages.admin.settings.system.sections.hexo_repository_sync': '远程仓库同步',
    'pages.admin.settings.system.sections.external_feeds': '外部动态',
    'pages.admin.settings.system.hints.hexo_sync_owner': '仓库 Owner',
    'pages.admin.settings.system.hints.hexo_sync_repo': '仓库名称',
    'pages.admin.settings.system.hints.hexo_sync_branch': '目标分支',
    'pages.admin.settings.system.hints.hexo_sync_posts_dir': '文章目录',
    'pages.admin.settings.system.hints.hexo_sync_access_token': '仓库访问令牌',
    'pages.admin.settings.system.hints.memos_instance_url': 'Memos URL',
    'pages.admin.settings.system.hints.memos_access_token': 'Memos Token',
    'pages.admin.settings.system.hints.listmonk_instance_url': 'listmonk URL',
    'pages.admin.settings.system.hints.listmonk_username': 'listmonk 用户名',
    'pages.admin.settings.system.hints.listmonk_access_token': 'listmonk Token',
    'pages.admin.settings.system.hints.listmonk_default_list_ids': '默认列表',
    'pages.admin.settings.system.hints.listmonk_category_list_map': '分类映射',
    'pages.admin.settings.system.hints.listmonk_tag_list_map': '标签映射',
    'pages.admin.settings.system.hints.listmonk_template_id': '模板',
    'pages.admin.settings.system.hints.external_feed_home_limit': '首页数量',
    'pages.admin.settings.system.hints.external_feed_cache_ttl_seconds': '缓存 TTL',
    'pages.admin.settings.system.hints.external_feed_stale_while_error_seconds': '失败回退窗口',
    'pages.admin.settings.system.hints.external_feed_sources': '来源配置',
    'pages.admin.settings.system.external_feeds.refresh_cache': '手动刷新缓存',
    'pages.admin.settings.system.external_feeds.refresh_cache_hint': '修改来源配置后，可立即拉取最新 RSS / RSSHub 快照。',
    'pages.admin.settings.system.external_feeds.refresh_cache_success': '外部动态缓存已刷新。',
    'pages.admin.settings.system.external_feeds.refresh_cache_failed': '刷新外部动态缓存失败。',
    'pages.admin.settings.system.hexo_sync.providers.github': 'GitHub',
    'pages.admin.settings.system.hexo_sync.providers.gitee': 'Gitee',
    'pages.admin.settings.system.memos.visibility.PUBLIC': 'Public',
    'pages.admin.settings.system.memos.visibility.PROTECTED': 'Protected',
    'pages.admin.settings.system.memos.visibility.PRIVATE': 'Private',
}

function translate(key: string) {
    return translations[key] || key
}

vi.mock('vue-i18n', async (importOriginal) => {
    const actual = await importOriginal<typeof import('vue-i18n')>()

    return {
        ...actual,
        useI18n: () => ({
            t: translate,
            locale: ref('zh-CN'),
        }),
    }
})

mockNuxtImport('useAppApi', () => () => ({
    $appFetch: mockAppFetch,
}))

mockNuxtImport('useRequestFeedback', () => () => ({
    showSuccessToast,
    showErrorToast,
}))

const defaultSettings = {
    memos_enabled: false,
    memos_instance_url: '',
    memos_access_token: '',
    memos_default_visibility: 'PUBLIC',
    listmonk_enabled: false,
    listmonk_instance_url: '',
    listmonk_username: '',
    listmonk_access_token: '',
    listmonk_default_list_ids: '',
    listmonk_category_list_map: '',
    listmonk_tag_list_map: '',
    listmonk_template_id: '',
    hexo_sync_enabled: false,
    hexo_sync_provider: 'github',
    hexo_sync_owner: '',
    hexo_sync_repo: '',
    hexo_sync_branch: 'main',
    hexo_sync_posts_dir: 'source/_posts',
    hexo_sync_access_token: '',
    external_feed_enabled: false,
    external_feed_home_enabled: false,
    external_feed_home_limit: 6,
    external_feed_cache_ttl_seconds: 900,
    external_feed_stale_while_error_seconds: 86400,
    external_feed_sources: '[]',
}

const stubs = {
    SettingFormField: { template: '<div class="setting-field" :data-field-key="fieldKey"><slot /></div>', props: ['fieldKey', 'inputId', 'metadata', 'inline', 'description'] },
    ToggleSwitch: {
        template: '<input :id="id" class="toggle-switch" type="checkbox" :checked="modelValue" :disabled="disabled" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
        props: ['id', 'modelValue', 'disabled'],
        emits: ['update:modelValue'],
    },
    InputText: {
        template: `<input :id="id" class="input-text" :value="modelValue ?? ''" :placeholder="placeholder" :disabled="disabled" @input="$emit('update:modelValue', $event.target.value)" />`,
        props: ['id', 'modelValue', 'placeholder', 'disabled', 'fluid'],
        emits: ['update:modelValue'],
    },
    Password: {
        template: `<input :id="id" class="password-input" :value="modelValue ?? ''" :placeholder="placeholder" :disabled="disabled" @input="$emit('update:modelValue', $event.target.value)" />`,
        props: ['id', 'modelValue', 'placeholder', 'disabled', 'toggleMask', 'fluid'],
        emits: ['update:modelValue'],
    },
    Textarea: {
        template: `<textarea :id="id" class="textarea-input" :value="modelValue ?? ''" :placeholder="placeholder" :disabled="disabled" @input="$emit('update:modelValue', $event.target.value)" />`,
        props: ['id', 'modelValue', 'placeholder', 'disabled', 'rows', 'fluid'],
        emits: ['update:modelValue'],
    },
    Select: {
        template: `
            <select :id="id" class="select-input" :value="modelValue ?? ''" :disabled="disabled" @change="$emit('update:modelValue', $event.target.value)">
                <option
                    v-for="option in options"
                    :key="typeof option === 'string' ? option : option[optionValue || 'value']"
                    :value="typeof option === 'string' ? option : option[optionValue || 'value']"
                >
                    {{ typeof option === 'string' ? option : option[optionLabel || 'label'] }}
                </option>
            </select>
        `,
        props: ['id', 'modelValue', 'options', 'disabled', 'optionLabel', 'optionValue', 'fluid'],
        emits: ['update:modelValue'],
    },
    InputNumber: {
        template: '<input :id="id" class="number-input" type="number" :value="modelValue" :disabled="disabled" @input="$emit(\'update:modelValue\', Number($event.target.value))" />',
        props: ['id', 'modelValue', 'disabled', 'min', 'max', 'fluid'],
        emits: ['update:modelValue'],
    },
    ExternalFeedSourcesEditor: {
        name: 'ExternalFeedSourcesEditor',
        template: '<button class="external-feed-sources-editor-stub" :disabled="disabled" @click="$emit(\'update:modelValue\', payload)">edit sources</button>',
        props: ['modelValue', 'disabled'],
        emits: ['update:modelValue'],
        data() {
            return {
                payload: '[{"source":"rss"}]',
            }
        },
    },
    Button: defineComponent({
        name: 'Button',
        props: {
            label: {
                type: String,
                default: '',
            },
            icon: {
                type: String,
                default: '',
            },
            severity: {
                type: String,
                default: '',
            },
            loading: {
                type: Boolean,
                default: false,
            },
            onClick: {
                type: Function as PropType<((event: MouseEvent) => void) | undefined>,
                default: undefined,
            },
        },
        emits: ['click'],
        setup(props, { emit }) {
            function handleClick(event: MouseEvent) {
                emit('click', event)
                props.onClick?.(event)
            }

            return {
                handleClick,
            }
        },
        template: `<button class="refresh-cache-button" :data-loading="loading ? 'true' : 'false'" @click="handleClick">{{ label }}</button>`,
    }),
}

function createSettings(overrides: Record<string, unknown> = {}) {
    return reactive({
        ...defaultSettings,
        ...overrides,
    })
}

function createMetadata(lockedKeys: string[] = []) {
    const lockedKeySet = new Set(lockedKeys)

    return new Proxy({}, {
        get: (_, key) => ({
            isLocked: typeof key === 'string' && lockedKeySet.has(key),
        }),
    })
}

async function mountComponent(settings: ReturnType<typeof createSettings>, lockedKeys: string[] = []) {
    const { default: ThirdPartySettings } = await import('./third-party-settings.vue')

    return mountSuspended(ThirdPartySettings, {
        props: {
            settings,
            metadata: createMetadata(lockedKeys),
        },
        global: {
            mocks: {
                $t: translate,
            },
            stubs,
        },
    })
}

function getRefreshHandler(wrapper: Awaited<ReturnType<typeof mountComponent>>) {
    return wrapper.getComponent({ name: 'Button' }).props('onClick') as (() => Promise<void>) | undefined
}

describe('ThirdPartySettings', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockAppFetch.mockResolvedValue({
            data: {
                refreshedAt: '2026-05-05T00:00:00.000Z',
                sourceCount: 2,
                snapshotCount: 3,
                failureCount: 0,
            },
        })
    })

    it('renders and updates memos and listmonk fields when both sections are enabled', async () => {
        const settings = createSettings({
            memos_enabled: true,
            listmonk_enabled: true,
        })

        const wrapper = await mountComponent(settings)

        expect(wrapper.find('#memos_instance_url').exists()).toBe(true)
        expect(wrapper.find('#memos_access_token').exists()).toBe(true)
        expect(wrapper.find('#memos_default_visibility').exists()).toBe(true)
        expect(wrapper.find('#listmonk_instance_url').exists()).toBe(true)
        expect(wrapper.find('#listmonk_template_id').exists()).toBe(true)

        await wrapper.get('#memos_instance_url').setValue('https://memos.example.com')
        await wrapper.get('#memos_access_token').setValue('memos-secret')
        await wrapper.get('#memos_default_visibility').setValue('PRIVATE')
        await wrapper.get('#listmonk_instance_url').setValue('https://listmonk.example.com')
        await wrapper.get('#listmonk_username').setValue('admin')
        await wrapper.get('#listmonk_access_token').setValue('listmonk-secret')
        await wrapper.get('#listmonk_default_list_ids').setValue('1,2')
        await wrapper.get('#listmonk_category_list_map').setValue('{"tech":[1]}')
        await wrapper.get('#listmonk_tag_list_map').setValue('{"nuxt":[2]}')
        await wrapper.get('#listmonk_template_id').setValue('42')

        expect(settings.memos_instance_url).toBe('https://memos.example.com')
        expect(settings.memos_access_token).toBe('memos-secret')
        expect(settings.memos_default_visibility).toBe('PRIVATE')
        expect(settings.listmonk_instance_url).toBe('https://listmonk.example.com')
        expect(settings.listmonk_username).toBe('admin')
        expect(settings.listmonk_access_token).toBe('listmonk-secret')
        expect(settings.listmonk_default_list_ids).toBe('1,2')
        expect(settings.listmonk_category_list_map).toBe('{"tech":[1]}')
        expect(settings.listmonk_tag_list_map).toBe('{"nuxt":[2]}')
        expect(settings.listmonk_template_id).toBe('42')

        await wrapper.get('#memos_enabled').setValue(false)
        await wrapper.get('#listmonk_enabled').setValue(false)

        expect(settings.memos_enabled).toBe(false)
        expect(settings.listmonk_enabled).toBe(false)
        expect(wrapper.find('#memos_instance_url').exists()).toBe(false)
        expect(wrapper.find('#listmonk_instance_url').exists()).toBe(false)
    })

    it('renders and updates the remote repository sync section when enabled', async () => {
        const settings = createSettings({
            hexo_sync_enabled: true,
            hexo_sync_provider: 'github',
            hexo_sync_owner: 'CaoMeiYouRen',
            hexo_sync_repo: 'momei-posts',
            hexo_sync_branch: 'main',
            hexo_sync_posts_dir: 'source/_posts',
            hexo_sync_access_token: '********',
        })

        const wrapper = await mountComponent(settings)

        expect(wrapper.text()).toContain('远程仓库同步')
        expect(wrapper.find('[data-field-key="hexo_sync_provider"]').exists()).toBe(true)
        expect(wrapper.find('[data-field-key="hexo_sync_owner"]').exists()).toBe(true)
        expect(wrapper.find('[data-field-key="hexo_sync_repo"]').exists()).toBe(true)
        expect(wrapper.find('[data-field-key="hexo_sync_access_token"]').exists()).toBe(true)

        await wrapper.get('#hexo_sync_provider').setValue('gitee')
        await wrapper.get('#hexo_sync_owner').setValue('mirror-owner')
        await wrapper.get('#hexo_sync_repo').setValue('mirror-repo')
        await wrapper.get('#hexo_sync_branch').setValue('develop')
        await wrapper.get('#hexo_sync_posts_dir').setValue('content/posts')
        await wrapper.get('#hexo_sync_access_token').setValue('token-next')
        await wrapper.get('#hexo_sync_enabled').setValue(false)

        expect(settings.hexo_sync_provider).toBe('gitee')
        expect(settings.hexo_sync_owner).toBe('mirror-owner')
        expect(settings.hexo_sync_repo).toBe('mirror-repo')
        expect(settings.hexo_sync_branch).toBe('develop')
        expect(settings.hexo_sync_posts_dir).toBe('content/posts')
        expect(settings.hexo_sync_access_token).toBe('token-next')
        expect(settings.hexo_sync_enabled).toBe(false)
        expect(wrapper.find('#hexo_sync_provider').exists()).toBe(false)
    })

    it('refreshes external feeds, updates sources, and propagates feed settings', async () => {
        const settings = createSettings({
            external_feed_enabled: true,
            external_feed_home_enabled: true,
        })

        const wrapper = await mountComponent(settings)

        expect(wrapper.find('.refresh-cache-button').exists()).toBe(true)
        expect(wrapper.find('.external-feed-sources-editor-stub').exists()).toBe(true)
        expect(wrapper.text()).toContain('手动刷新缓存')
        expect(wrapper.text()).toContain('修改来源配置后，可立即拉取最新 RSS / RSSHub 快照。')

        await wrapper.getComponent({ name: 'ExternalFeedSourcesEditor' }).vm.$emit('update:modelValue', '[{"source":"rss"}]')
        await wrapper.get('#external_feed_home_enabled').setValue(false)
        await wrapper.get('#external_feed_home_limit').setValue('8')
        await wrapper.get('#external_feed_cache_ttl_seconds').setValue('1200')
        await wrapper.get('#external_feed_stale_while_error_seconds').setValue('172800')
        const refreshHandler = getRefreshHandler(wrapper)

        expect(typeof refreshHandler).toBe('function')

        await refreshHandler?.()
        await flushPromises()

        expect(settings.external_feed_sources).toBe('[{"source":"rss"}]')
        expect(settings.external_feed_home_enabled).toBe(false)
        expect(settings.external_feed_home_limit).toBe(8)
        expect(settings.external_feed_cache_ttl_seconds).toBe('1200')
        expect(settings.external_feed_stale_while_error_seconds).toBe('172800')
        expect(mockAppFetch).toHaveBeenCalledWith('/api/admin/external-feed/refresh', {
            method: 'POST',
        })
        expect(showSuccessToast).toHaveBeenCalledWith('pages.admin.settings.system.external_feeds.refresh_cache_success')
        expect(showErrorToast).not.toHaveBeenCalled()

        await wrapper.get('#external_feed_enabled').setValue(false)

        expect(settings.external_feed_enabled).toBe(false)
        expect(wrapper.find('.refresh-cache-button').exists()).toBe(false)
    })

    it('shows an error toast when external feed refresh fails', async () => {
        const settings = createSettings({
            external_feed_enabled: true,
        })
        const refreshError = new Error('refresh failed')
        mockAppFetch.mockRejectedValueOnce(refreshError)

        const wrapper = await mountComponent(settings)

        const refreshHandler = getRefreshHandler(wrapper)

        expect(typeof refreshHandler).toBe('function')

        await refreshHandler?.()
        await flushPromises()

        expect(showSuccessToast).not.toHaveBeenCalled()
        expect(showErrorToast).toHaveBeenCalledWith(refreshError, {
            fallbackKey: 'pages.admin.settings.system.external_feeds.refresh_cache_failed',
        })
    })
})
