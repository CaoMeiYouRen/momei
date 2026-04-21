import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'

import AdminFriendLinksPage from './index.vue'

const translations: Record<string, string> = {
    'components.friend_links.fields.site_url': 'Shared Site URL',
    'components.friend_links.fields.logo': 'Shared Logo',
    'components.friend_links.fields.rss_url': 'Shared RSS URL',
    'components.friend_links.fields.contact_email': 'Shared Contact Email',
    'pages.admin.friend_links.title': 'Friend Links',
    'pages.admin.friend_links.create_category': 'Create Category',
    'pages.admin.friend_links.create_link': 'Create Link',
    'pages.admin.friend_links.links': 'Links',
    'pages.admin.friend_links.categories': 'Categories',
    'pages.admin.friend_links.applications': 'Applications',
    'pages.admin.friend_links.link_status': 'Link Status',
    'pages.admin.friend_links.health_status': 'Health Status',
    'pages.admin.friend_links.featured': 'Featured',
    'pages.admin.friend_links.pinned': 'Pinned',
    'pages.admin.friend_links.sort_order': 'Sort Order',
    'pages.admin.friend_links.last_checked_at': 'Last Checked',
    'pages.admin.friend_links.logo_placeholder': 'Logo Placeholder',
    'pages.admin.friend_links.empty_links': 'Empty Links',
    'pages.admin.friend_links.empty_categories': 'Empty Categories',
    'pages.admin.friend_links.empty_applications': 'Empty Applications',
    'pages.admin.friend_links.edit_link': 'Edit Link',
    'pages.admin.friend_links.review_application': 'Review Application',
    'pages.admin.friend_links.review_note': 'Review Note',
    'pages.admin.friend_links.applicant_account': 'Applicant Account',
    'pages.admin.friend_links.reciprocal_url': 'Reciprocal Link Page',
    'pages.admin.friend_links.submitted_ip': 'Submitted IP',
    'pages.admin.friend_links.approve': 'Approve',
    'pages.admin.friend_links.reject': 'Reject',
    'pages.admin.friend_links.enabled': 'Enabled',
    'pages.admin.friend_links.is_featured': 'Feature',
    'pages.admin.friend_links.is_pinned': 'Pinned',
    'pages.admin.friend_links.statuses.active': 'Active',
    'pages.admin.friend_links.health_statuses.unknown': 'Unknown',
    'pages.admin.friend_links.application_statuses.pending': 'Pending',
    'common.name': 'Name',
    'common.category': 'Category',
    'common.slug': 'Slug',
    'common.description': 'Description',
    'common.actions': 'Actions',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.created_at': 'Created At',
    'pages.links.uncategorized': 'Uncategorized',
}

const translate = (key: string) => translations[key] ?? key

mockNuxtImport('useAdminFriendLinksPage', () => () => ({
    tt: translate,
    loading: ref({ links: false, categories: false, applications: false }),
    saving: ref(false),
    links: ref([{ id: 'link-1', name: 'Example', url: 'https://example.com', status: 'active', healthStatus: 'unknown', isFeatured: false, isPinned: false, sortOrder: 1, lastCheckedAt: null, category: null }]),
    categories: ref([]),
    applications: ref([]),
    linkDialogVisible: ref(true),
    categoryDialogVisible: ref(false),
    reviewDialogVisible: ref(true),
    editingLink: ref(null),
    editingCategory: ref(null),
    selectedApplication: ref({ id: 'app-1', name: 'Applicant', contactEmail: 'contact@example.com', applicant: null, url: 'https://applicant.example.com', reciprocalUrl: 'https://applicant.example.com/links', submittedIp: '127.0.0.1', createdAt: null }),
    linkForm: ref({ name: '', url: '', logo: '', rssUrl: '', contactEmail: '', categoryId: '', status: 'active', sortOrder: 0, description: '', isFeatured: false, isPinned: false }),
    categoryForm: ref({ name: '', slug: '', sortOrder: 0, description: '', isEnabled: true }),
    reviewForm: ref({ reviewNote: '', linkData: { categoryId: '', sortOrder: 0, isFeatured: false, isPinned: false } }),
    linkStatusOptions: ref([{ label: 'Active', value: 'active' }]),
    getLinkStatusSeverity: vi.fn(() => 'success'),
    getHealthStatusSeverity: vi.fn(() => 'secondary'),
    getApplicationStatusSeverity: vi.fn(() => 'warning'),
    formatDate: vi.fn(() => '-'),
    shouldSuggestReviewOrDisable: vi.fn(() => false),
    loadLinks: vi.fn(),
    openLinkDialog: vi.fn(),
    saveLink: vi.fn(),
    confirmDeleteLink: vi.fn(),
    openCategoryDialog: vi.fn(),
    saveCategory: vi.fn(),
    confirmDeleteCategory: vi.fn(),
    openReviewDialog: vi.fn(),
    submitReview: vi.fn(),
    confirmReviewOrDisable: vi.fn(),
}))

const stubs = {
    AdminPageHeader: { template: '<div class="admin-header">{{ title }}<slot name="actions" /></div>', props: ['title'] },
    Button: { template: '<button @click="$emit(\'click\')">{{ label }}<slot /></button>', props: ['label', 'icon', 'severity', 'loading', 'text', 'rounded', 'size'], emits: ['click'] },
    DataTable: { template: '<div class="datatable"><slot /><slot name="empty" /></div>', props: ['value', 'loading'] },
    Column: { template: '<div class="column">{{ header }}<slot :data="{}" /></div>', props: ['field', 'header'] },
    Tag: { template: '<span class="tag">{{ value }}</span>', props: ['value', 'severity'] },
    Dialog: { template: '<div v-if="visible" class="dialog">{{ header }}<slot /><slot name="footer" /></div>', props: ['visible', 'header', 'modal', 'class'] },
    InputText: { template: '<input :id="id" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />', props: ['id', 'modelValue', 'fluid'], emits: ['update:modelValue'] },
    InputNumber: { template: '<input :id="id" :value="modelValue" @input="$emit(\'update:modelValue\', Number($event.target.value))" />', props: ['id', 'modelValue', 'min', 'fluid'], emits: ['update:modelValue'] },
    Textarea: { template: '<textarea :id="id" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />', props: ['id', 'modelValue', 'rows', 'fluid'], emits: ['update:modelValue'] },
    Select: { template: '<select :id="id"><slot /></select>', props: ['id', 'modelValue', 'options', 'optionLabel', 'optionValue', 'fluid'], emits: ['update:modelValue'] },
    Checkbox: { template: '<input :id="inputId" type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />', props: ['modelValue', 'binary', 'inputId'], emits: ['update:modelValue'] },
    ConfirmDialog: { template: '<div class="confirm-dialog" />' },
    Toast: { template: '<div class="toast" />' },
    AppUploader: { template: '<div class="uploader">{{ placeholder }}</div>', props: ['id', 'modelValue', 'type', 'placeholder', 'accept'], emits: ['update:modelValue'] },
}

describe('AdminFriendLinksPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders shared friend link field labels instead of admin-page private keys', async () => {
        const wrapper = await mountSuspended(AdminFriendLinksPage, {
            global: {
                stubs,
                mocks: {
                    $t: translate,
                },
            },
        })

        const text = wrapper.text()

        expect(text).toContain('Shared Site URL')
        expect(text).toContain('Shared Logo')
        expect(text).toContain('Shared RSS URL')
        expect(text).toContain('Shared Contact Email')
        expect(text).not.toContain('pages.admin.friend_links.site_url')
        expect(text).not.toContain('pages.admin.friend_links.logo')
        expect(text).not.toContain('pages.admin.friend_links.rss_url')
        expect(text).not.toContain('pages.admin.friend_links.contact_email')
    })
})
