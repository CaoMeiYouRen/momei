<template>
    <div class="editor-layout">
        <!-- Top Bar -->
        <div class="top-bar">
            <div class="top-bar-left">
                <Button
                    v-tooltip="$t('pages.admin.posts.back_to_list')"
                    icon="pi pi-arrow-left"
                    text
                    rounded
                    @click="navigateTo('/admin/posts')"
                />
                <InputText
                    v-model="post.title"
                    :placeholder="$t('pages.admin.posts.title_placeholder')"
                    class="title-input"
                />
                <Tag
                    v-if="post.status"
                    :value="getStatusLabel(post.status)"
                    :severity="getStatusSeverity(post.status)"
                />
            </div>
            <div class="top-bar-right">
                <span v-if="saving" class="saving-text">{{ $t('common.saving') }}</span>
                <Button
                    :label="$t('common.save')"
                    icon="pi pi-save"
                    text
                    :loading="saving"
                    @click="savePost(false)"
                />
                <Button
                    :label="$t('common.publish')"
                    icon="pi pi-send"
                    :loading="saving"
                    severity="contrast"
                    @click="savePost(true)"
                />
                <Button
                    v-tooltip="$t('common.settings')"
                    icon="pi pi-cog"
                    text
                    rounded
                    @click="settingsVisible = true"
                />
            </div>
        </div>

        <!-- Editor Area -->
        <div class="editor-area">
            <ClientOnly>
                <mavon-editor
                    v-model="post.content"
                    class="mavon-editor"
                    :placeholder="$t('pages.admin.posts.content_placeholder')"
                />
            </ClientOnly>
        </div>

        <!-- Settings Drawer -->
        <Drawer
            v-model:visible="settingsVisible"
            :header="$t('pages.admin.posts.settings_title')"
            position="right"
            class="settings-drawer"
        >
            <div class="settings-form">
                <div class="form-group">
                    <label for="slug" class="form-label">{{ $t('pages.admin.posts.slug') }}</label>
                    <InputText
                        id="slug"
                        v-model="post.slug"
                        :placeholder="$t('pages.admin.posts.slug_placeholder')"
                    />
                    <small class="form-hint">{{ $t('pages.admin.posts.slug_hint') }}</small>
                </div>

                <div class="form-group">
                    <label for="category" class="form-label">{{ $t('common.category') }}</label>
                    <Select
                        v-model="post.categoryId"
                        :options="categories"
                        option-label="name"
                        option-value="id"
                        :placeholder="$t('pages.admin.posts.category_placeholder')"
                        show-clear
                    />
                </div>

                <div class="form-group">
                    <label for="tags" class="form-label">{{ $t('common.tags') }}</label>
                    <AutoComplete
                        v-model="selectedTags"
                        multiple
                        :suggestions="filteredTags"
                        :placeholder="$t('pages.admin.posts.tags_placeholder')"
                        @complete="searchTags"
                    />
                    <small class="form-hint">{{ $t('pages.admin.posts.tags_hint') }}</small>
                </div>

                <div class="form-group">
                    <label for="summary" class="form-label">{{ $t('common.summary') }}</label>
                    <Textarea
                        id="summary"
                        v-model="post.summary"
                        rows="4"
                        :placeholder="$t('pages.admin.posts.summary_placeholder')"
                        class="resize-none"
                    />
                </div>

                <div class="form-group">
                    <label for="cover" class="form-label">{{ $t('pages.admin.posts.cover_image') }}</label>
                    <InputText
                        id="cover"
                        v-model="post.coverImage"
                        placeholder="https://..."
                    />
                </div>
            </div>
            <template #footer>
                <div class="drawer-footer">
                    <Button
                        :label="$t('common.close')"
                        text
                        severity="secondary"
                        @click="settingsVisible = false"
                    />
                </div>
            </template>
        </Drawer>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

definePageMeta({
    layout: false,
})

const { t } = useI18n()

const route = useRoute()
const router = useRouter()

interface Post {
    id?: string
    title: string
    content: string
    slug: string
    status: 'draft' | 'published' | 'pending'
    summary: string
    coverImage: string
    categoryId: string | null
    tags: string[]
}

const post = ref<Post>({
    title: '',
    content: '',
    slug: '',
    status: 'draft',
    summary: '',
    coverImage: '',
    categoryId: null,
    tags: [],
})

const selectedTags = ref<string[]>([])
const filteredTags = ref<string[]>([])
const allTags = ref<string[]>([]) // Should be loaded from API

const settingsVisible = ref(false)
const saving = ref(false)
const categories = ref<{ id: string, name: string }[]>([])

const isNew = computed(() => route.params.id === 'new' || !route.params.id)

const loadPost = async () => {
    if (isNew.value) return
    try {
        const { data } = await $fetch<{ data: any }>(`/api/posts/${route.params.id}`)
        if (data) {
            post.value = {
                ...data,
                categoryId: data.category?.id || null,
                tags: data.tags?.map((t: any) => t.name) || [],
            }
            selectedTags.value = post.value.tags
        }
    } catch (error) {
        console.error('Failed to load post', error)
        // router.push('/admin/posts');
    }
}

const searchTags = (event: { query: string }) => {
    // In a real app, fetch from API
    // For now, just echo the query if not in list
    if (!event.query.trim().length) {
        filteredTags.value = [...allTags.value]
    } else {
        filteredTags.value = allTags.value.filter((tag) => {
            return tag.toLowerCase().startsWith(event.query.toLowerCase())
        })
        if (!filteredTags.value.includes(event.query)) {
            // Allow creating new tags implicitly by just typing
        }
    }
}

const savePost = async (publish = false) => {
    if (!post.value.title) {
        alert(t('pages.admin.posts.title_required'))
        return
    }

    saving.value = true
    try {
        const payload = {
            ...post.value,
            tags: selectedTags.value,
            status: publish ? 'published' : post.value.status,
        }

        if (isNew.value) {
            const response = await $fetch<{ code: number, data: any }>('/api/posts', {
                method: 'POST',
                body: payload,
            })
            if (response.code === 200 && response.data?.id) {
                post.value.id = response.data.id
                post.value.status = response.data.status
                // Replace route to edit mode without reloading
                router.replace(`/admin/posts/${response.data.id}`)
            }
        } else {
            await $fetch(`/api/posts/${route.params.id}`, {
                method: 'PUT',
                body: payload,
            })
            if (publish) {
                post.value.status = 'published'
            }
        }
        // In a real app, use a Toast service
        // alert('保存成功');
    } catch (error) {
        console.error('Failed to save post', error)
        alert(t('common.save_failed') || 'Save failed')
    } finally {
        saving.value = false
    }
}

const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
        published: t('common.status.published'),
        draft: t('common.status.draft'),
        pending: t('common.status.pending'),
    }
    return map[status] || status
}

const getStatusSeverity = (status: string) => {
    const map: Record<string, string> = {
        published: 'success',
        draft: 'secondary',
        pending: 'warn',
    }
    return map[status] || 'info'
}

onMounted(() => {
    loadPost()
    // Mock categories for now
    categories.value = [
        { id: '1', name: '技术' },
        { id: '2', name: '生活' },
        { id: '3', name: '随笔' },
    ]
})
</script>

<style lang="scss" scoped>
.editor-layout {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: var(--p-surface-50);
}

.top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 1rem;
    height: 4rem;
    border-bottom: 1px solid var(--p-surface-200);
    background-color: var(--p-surface-0);
    flex-shrink: 0;

    &-left {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex: 1;
    }

    &-right {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
}

.title-input {
    font-size: 1.25rem;
    font-weight: 700;
    width: 100%;
    max-width: 40rem;
    border: none;
    box-shadow: none;
    background: transparent;

    &:focus {
        box-shadow: none;
    }
}

.saving-text {
    font-size: 0.875rem;
    color: var(--p-surface-500);
    margin-right: 0.5rem;
}

.editor-area {
    flex: 1;
    display: flex;
    overflow: hidden;

    .mavon-editor {
        width: 100%;
        height: 100%;
        z-index: 1;
    }
}

.settings-drawer {
    width: 24rem;
}

.settings-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-label {
    font-weight: 500;
}

.form-hint {
    color: var(--p-surface-500);
}

.drawer-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
}

.resize-none {
    resize: none;
}

:global(.dark) {
    .editor-layout { background-color: var(--p-surface-950); }

    .top-bar {
        border-color: var(--p-surface-700);
        background-color: var(--p-surface-900);
    }
}
</style>
