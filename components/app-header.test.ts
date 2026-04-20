import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import AppHeader from './app-header.vue'
import { authClient } from '@/lib/auth-client'

const {
    mockEnsureLocaleMessageModules,
    navigateToMock,
    localePathMock,
    adminMenuToggleMock,
    userMenuToggleMock,
    mockSignOut,
} = vi.hoisted(() => ({
    mockEnsureLocaleMessageModules: vi.fn(),
    navigateToMock: vi.fn(),
    localePathMock: vi.fn((path: string) => `/zh-CN${path}`),
    adminMenuToggleMock: vi.fn(),
    userMenuToggleMock: vi.fn(),
    mockSignOut: vi.fn(),
}))

mockNuxtImport('navigateTo', () => navigateToMock)
mockNuxtImport('useLocalePath', () => () => localePathMock)

const { mockInvalidateAuthSessionState, mockRefreshAuthSession } = vi.hoisted(() => ({
    mockInvalidateAuthSessionState: vi.fn(),
    mockRefreshAuthSession: vi.fn(),
}))

vi.mock('@/composables/use-auth-session', () => ({
    invalidateAuthSessionState: mockInvalidateAuthSessionState,
    refreshAuthSession: mockRefreshAuthSession,
}))

vi.mock('@/i18n/config/locale-runtime-loader', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/i18n/config/locale-runtime-loader')>()

    return {
        ...actual,
        ensureLocaleMessageModules: vi.fn(async (options) => {
            mockEnsureLocaleMessageModules(options)
            return actual.ensureLocaleMessageModules(options)
        }),
    }
})

// Mock PrimeVue components
const AppLogoStub = defineComponent({
    template: '<div class="app-logo" />',
})

const AppNotificationsStub = defineComponent({
    template: '<div class="app-notifications" />',
})

const TravellingsLinkStub = defineComponent({
    template: '<a class="travellings-link-stub">Travellings</a>',
})

const NuxtLinkStub = defineComponent({
    inheritAttrs: false,
    props: {
        to: {
            type: [String, Object],
            default: '',
        },
    },
    emits: ['click'],
    setup(props, { attrs, emit, slots }) {
        return () => h(
            'a',
            {
                ...attrs,
                href: typeof props.to === 'string' ? props.to : '#',
                onClick: (event: Event) => emit('click', event),
            },
            slots.default?.(),
        )
    },
})

const ButtonStub = defineComponent({
    inheritAttrs: false,
    props: {
        icon: {
            type: String,
            default: '',
        },
        label: {
            type: String,
            default: '',
        },
    },
    emits: ['click'],
    template: '<button type="button" v-bind="$attrs" :icon="icon" :label="label" @click="$emit(\'click\', $event)"><slot />{{ label }}</button>',
})

const MenuStub = defineComponent({
    inheritAttrs: false,
    setup(_, { attrs, expose }) {
        const id = typeof attrs.id === 'string' ? attrs.id : ''

        expose({
            toggle(event: Event) {
                if (id === 'admin_menu') {
                    adminMenuToggleMock(event)
                    return
                }

                userMenuToggleMock(event)
            },
        })

        return () => h('div', { class: 'menu-stub', ...attrs })
    },
})

const DrawerStub = defineComponent({
    props: {
        visible: {
            type: Boolean,
            default: false,
        },
    },
    template: '<div v-if="visible" class="drawer-stub"><slot /></div>',
})

const DividerStub = defineComponent({
    template: '<hr />',
})

const LanguageSwitcherStub = defineComponent({
    template: '<div />',
})

const stubs = {
    AppLogo: AppLogoStub,
    AppNotifications: AppNotificationsStub,
    TravellingsLink: TravellingsLinkStub,
    NuxtLink: NuxtLinkStub,
    Button: ButtonStub,
    Menu: MenuStub,
    Drawer: DrawerStub,
    Divider: DividerStub,
    LanguageSwitcher: LanguageSwitcherStub,
}

// Mock authClient
vi.mock('@/lib/auth-client', () => ({
    authClient: {
        useSession: vi.fn(() => ({ value: { data: null, isPending: false } })),
        signOut: mockSignOut,
    },
}))

const sessionState = ref<{ data: { user: { id: string, role: string, name?: string } } | null, isPending: boolean }>({
    data: null,
    isPending: false,
})

// Mock @vueuse/core
const mockIsDarkRef = ref(false)
const mockToggleDark = vi.fn(() => {
    mockIsDarkRef.value = !mockIsDarkRef.value
})

vi.mock('@vueuse/core', () => ({
    useDark: vi.fn(() => mockIsDarkRef),
    useToggle: vi.fn(() => mockToggleDark),
    usePreferredDark: vi.fn(() => ref(false)),
    useIntervalFn: vi.fn(() => ({
        pause: vi.fn(),
        resume: vi.fn(),
    })),
}))

// Mock useSearch
const mockOpenSearch = vi.fn()
vi.mock('@/composables/use-search', () => ({
    useSearch: () => ({
        openSearch: mockOpenSearch,
    }),
}))

describe('AppHeader', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockIsDarkRef.value = false
        localePathMock.mockImplementation((path: string) => `/zh-CN${path}`)
        sessionState.value = {
            data: null,
            isPending: false,
        }
        // @ts-expect-error - mock function
        authClient.useSession.mockReturnValue(sessionState)
    })

    it('renders logo and navigation links', async () => {
        const wrapper = await mountSuspended(AppHeader, {
            global: { stubs },
        })

        expect(wrapper.find('.app-logo').exists()).toBe(true)
        expect(wrapper.find('#nav-home').attributes('href')).toBe('/zh-CN/')
        expect(wrapper.find('#nav-posts').attributes('href')).toBe('/zh-CN/posts')
        expect(wrapper.find('#nav-archives').attributes('href')).toBe('/zh-CN/archives')
        expect(wrapper.find('#nav-friend-link-application').attributes('href')).toBe('/zh-CN/friend-links')
    })

    it('shows login button when not logged in', async () => {
        const wrapper = await mountSuspended(AppHeader, {
            global: { stubs },
        })
        expect(wrapper.find('#login-btn').attributes('icon')).toBe('pi pi-sign-in')
    })

    it('shows user profile button and admin menu when logged in as admin', async () => {
        sessionState.value = {
            data: {
                user: { id: '1', role: 'admin', name: 'Admin' },
            },
            isPending: false,
        }

        const wrapper = await mountSuspended(AppHeader, {
            global: { stubs },
        })

        await vi.waitFor(() => {
            expect(wrapper.find('#desktop-admin-posts-link').exists()).toBe(true)
        })

        expect(wrapper.find('#user-menu-btn').attributes('icon')).toBe('pi pi-user')
        expect(wrapper.find('#desktop-admin-posts-link').exists()).toBe(true)
        expect(wrapper.find('#admin-posts-shortcut').exists()).toBe(true)
        expect(wrapper.find('#mobile-admin-posts-btn').exists()).toBe(true)
        expect(wrapper.find('#admin-menu-btn').exists()).toBe(true)
        expect(mockEnsureLocaleMessageModules).toHaveBeenCalledWith(
            expect.objectContaining({
                locale: expect.any(String),
                modules: ['admin'],
            }),
        )
        expect(wrapper.text()).toMatch(/文章管理|Post Management/)
        expect(wrapper.text()).not.toContain('pages.admin.posts.title')
    })

    it('shows post shortcuts for author role', async () => {
        sessionState.value = {
            data: {
                user: { id: '3', role: 'author', name: 'Author' },
            },
            isPending: false,
        }

        const wrapper = await mountSuspended(AppHeader, {
            global: { stubs },
        })

        await vi.waitFor(() => {
            expect(wrapper.find('#desktop-admin-posts-link').exists()).toBe(true)
        })

        expect(wrapper.find('#desktop-admin-posts-link').exists()).toBe(true)
        expect(wrapper.find('#admin-posts-shortcut').exists()).toBe(true)
        expect(wrapper.find('#mobile-admin-posts-btn').exists()).toBe(true)
        expect(wrapper.find('#admin-menu-btn').exists()).toBe(true)
        expect(wrapper.text()).toMatch(/文章管理|Post Management/)
        expect(wrapper.text()).not.toContain('pages.admin.posts.title')
    })

    it('renders admin posts link after travellings in desktop nav', async () => {
        sessionState.value = {
            data: {
                user: { id: '5', role: 'admin', name: 'Admin' },
            },
            isPending: false,
        }

        const wrapper = await mountSuspended(AppHeader, {
            global: { stubs },
        })

        await vi.waitFor(() => {
            expect(wrapper.find('#desktop-admin-posts-link').exists()).toBe(true)
        })

        const navHtml = wrapper.find('.app-header__nav').html()

        expect(navHtml.indexOf('travellings-link-stub')).toBeGreaterThan(-1)
        expect(navHtml.indexOf('desktop-admin-posts-link')).toBeGreaterThan(navHtml.indexOf('travellings-link-stub'))
    })

    it('hides post shortcuts for non-admin roles', async () => {
        sessionState.value = {
            data: {
                user: { id: '4', role: 'user', name: 'User' },
            },
            isPending: false,
        }

        const wrapper = await mountSuspended(AppHeader, {
            global: { stubs },
        })

        expect(wrapper.find('#desktop-admin-posts-link').exists()).toBe(false)
        expect(wrapper.find('#admin-posts-shortcut').exists()).toBe(false)
        expect(wrapper.find('#mobile-admin-posts-btn').exists()).toBe(false)
        expect(wrapper.find('#admin-menu-btn').exists()).toBe(false)
    })

    it('loads auth locale module when session changes from anonymous to user', async () => {
        const wrapper = await mountSuspended(AppHeader, {
            global: { stubs },
        })

        expect(mockEnsureLocaleMessageModules).not.toHaveBeenCalled()

        sessionState.value = {
            data: {
                user: { id: '2', role: 'user', name: 'User' },
            },
            isPending: false,
        }

        await nextTick()
        await nextTick()

        expect(wrapper.find('#user-menu-btn').exists()).toBe(true)
        expect(mockEnsureLocaleMessageModules).not.toHaveBeenCalled()
    })

    it('calls openSearch when search button is clicked', async () => {
        const wrapper = await mountSuspended(AppHeader, {
            global: { stubs },
        })

        await wrapper.find('#search-btn').trigger('click')
        expect(mockOpenSearch).toHaveBeenCalled()
    })

    it('toggles dark mode when theme switcher is clicked', async () => {
        const wrapper = await mountSuspended(AppHeader, {
            global: { stubs },
        })

        await wrapper.find('#theme-switcher').trigger('click')
        expect(mockToggleDark).toHaveBeenCalled()
    })

    it('dispatches mobile search, keyboard shortcuts and menu toggles', async () => {
        sessionState.value = {
            data: {
                user: { id: '8', role: 'admin', name: 'Admin' },
            },
            isPending: false,
        }

        const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
        const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

        const wrapper = await mountSuspended(AppHeader, {
            global: { stubs },
        })

        expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))

        const mobileMenuButton = wrapper.findAll('button').find((button) => button.attributes('icon') === 'pi pi-bars')
        expect(mobileMenuButton).toBeDefined()

        await mobileMenuButton!.trigger('click')
        await nextTick()
        expect(wrapper.find('.drawer-stub').exists()).toBe(true)

        const mobileSearchTrigger = wrapper.find('.mobile-menu > .mobile-nav-link')
        await mobileSearchTrigger.trigger('click')
        expect(mockOpenSearch).toHaveBeenCalledTimes(1)

        const addEventListenerCalls = addEventListenerSpy.mock.calls as [string, EventListenerOrEventListenerObject][]
        const keydownCall = addEventListenerCalls.find(([eventName]) => eventName === 'keydown')
        const keydownHandler = typeof keydownCall?.[1] === 'function'
            ? keydownCall[1] as (event: KeyboardEvent) => void
            : undefined
        const preventDefault = vi.fn()

        expect(keydownHandler).toBeDefined()

        keydownHandler?.({
            ctrlKey: true,
            metaKey: false,
            key: 'k',
            preventDefault,
        } as unknown as KeyboardEvent)

        expect(preventDefault).toHaveBeenCalledTimes(1)
        expect(mockOpenSearch).toHaveBeenCalledTimes(2)

        const fakeEvent = new Event('click')
        await wrapper.find('#admin-menu-btn').trigger('click', fakeEvent)
        await wrapper.find('#user-menu-btn').trigger('click', fakeEvent)

        expect(adminMenuToggleMock).toHaveBeenCalledTimes(1)
        expect(userMenuToggleMock).toHaveBeenCalledTimes(1)

        wrapper.unmount()
        expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', keydownHandler)
    })

    it('executes admin and user menu commands with localized navigation targets', async () => {
        sessionState.value = {
            data: {
                user: { id: '6', role: 'admin', name: 'Admin' },
            },
            isPending: false,
        }

        const wrapper = await mountSuspended(AppHeader, {
            global: { stubs },
        })

        await vi.waitFor(() => {
            expect(wrapper.find('#admin-menu-btn').exists()).toBe(true)
        })

        const adminMenuItems = (wrapper.vm as any).adminMenuItems as Record<string, any>[]
        const userMenuItems = (wrapper.vm as any).userMenuItems as Record<string, any>[]

        for (const item of adminMenuItems) {
            item.command?.()

            for (const child of item.items ?? []) {
                child.command?.()
            }
        }

        const settingsMenuItem = userMenuItems.at(0)
        expect(settingsMenuItem).toBeDefined()
        settingsMenuItem?.command?.()

        expect(navigateToMock).toHaveBeenCalledWith('/zh-CN/admin')
        expect(navigateToMock).toHaveBeenCalledWith('/zh-CN/admin/posts')
        expect(navigateToMock).toHaveBeenCalledWith('/zh-CN/admin/snippets')
        expect(navigateToMock).toHaveBeenCalledWith('/zh-CN/admin/categories')
        expect(navigateToMock).toHaveBeenCalledWith('/zh-CN/admin/tags')
        expect(navigateToMock).toHaveBeenCalledWith('/zh-CN/admin/comments')
        expect(navigateToMock).toHaveBeenCalledWith('/zh-CN/admin/submissions')
        expect(navigateToMock).toHaveBeenCalledWith('/zh-CN/admin/ai')
        expect(navigateToMock).toHaveBeenCalledWith('/zh-CN/admin/users')
        expect(navigateToMock).toHaveBeenCalledWith('/zh-CN/admin/subscribers')
        expect(navigateToMock).toHaveBeenCalledWith('/zh-CN/admin/ad/campaigns')
        expect(navigateToMock).toHaveBeenCalledWith('/zh-CN/admin/ad/placements')
        expect(navigateToMock).toHaveBeenCalledWith('/zh-CN/admin/external-links')
        expect(navigateToMock).toHaveBeenCalledWith('/zh-CN/admin/migrations/link-governance')
        expect(navigateToMock).toHaveBeenCalledWith('/zh-CN/admin/friend-links')
        expect(navigateToMock).toHaveBeenCalledWith('/zh-CN/admin/marketing')
        expect(navigateToMock).toHaveBeenCalledWith('/zh-CN/admin/notifications')
        expect(navigateToMock).toHaveBeenCalledWith('/zh-CN/admin/settings/theme')
        expect(navigateToMock).toHaveBeenCalledWith('/zh-CN/admin/settings')
        expect(navigateToMock).toHaveBeenCalledWith('/zh-CN/settings')
    })

    it('refreshes auth session when logout reports an error or throws', async () => {
        sessionState.value = {
            data: {
                user: { id: '7', role: 'user', name: 'User' },
            },
            isPending: false,
        }

        const wrapper = await mountSuspended(AppHeader, {
            global: { stubs },
        })

        const userMenuItems = (wrapper.vm as any).userMenuItems as Record<string, any>[]

        const logoutMenuItem = userMenuItems.at(1)
        expect(logoutMenuItem).toBeDefined()

        mockSignOut.mockResolvedValueOnce({ error: true })
        await logoutMenuItem?.command?.()

        mockSignOut.mockRejectedValueOnce(new Error('network failed'))
        await logoutMenuItem?.command?.()

        expect(mockInvalidateAuthSessionState).toHaveBeenCalledTimes(2)
        expect(mockRefreshAuthSession).toHaveBeenCalledTimes(2)
    })
})
