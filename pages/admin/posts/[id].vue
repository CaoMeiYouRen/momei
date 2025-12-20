<template>
    <div class="editor-layout">
        <!-- Top Bar -->
        <div class="top-bar">
            <div class="top-bar-left">
                <Button
                    v-tooltip="'返回列表'"
                    icon="pi pi-arrow-left"
                    text
                    rounded
                    @click="navigateTo('/admin/posts')"
                />
                <InputText
                    v-model="post.title"
                    placeholder="文章标题"
                    class="title-input"
                />
                <Tag
                    v-if="post.status"
                    :value="getStatusLabel(post.status)"
                    :severity="getStatusSeverity(post.status)"
                />
            </div>
            <div class="top-bar-right">
                <span v-if="saving" class="saving-text">保存中...</span>
                <Button
                    label="保存"
                    icon="pi pi-save"
                    text
                    :loading="saving"
                    @click="savePost(false)"
                />
                <Button
                    label="发布"
                    icon="pi pi-send"
                    :loading="saving"
                    severity="contrast"
                    @click="savePost(true)"
                />
                <Button
                    v-tooltip="'设置'"
                    icon="pi pi-cog"
                    text
                    rounded
                    @click="settingsVisible = true"
                />
            </div>
        </div>

        <!-- Editor Area -->
        <div class="editor-area">
            <!-- Markdown Input -->
            <div class="editor-input-container">
                <textarea
                    v-model="post.content"
                    class="editor-textarea"
                    placeholder="开始写作... (支持 Markdown)"
                />
            </div>
            <!-- Preview -->
            <div class="editor-preview-container">
                <!-- eslint-disable-next-line vue/no-v-html -->
                <div class="markdown-body" v-html="renderedContent" />
            </div>
        </div>

        <!-- Settings Drawer -->
        <Drawer
            v-model:visible="settingsVisible"
            header="文章设置"
            position="right"
            class="settings-drawer"
        >
            <div class="settings-form">
                <div class="form-group">
                    <label for="slug" class="form-label">URL Slug</label>
                    <InputText
                        id="slug"
                        v-model="post.slug"
                        placeholder="custom-url-slug"
                    />
                    <small class="form-hint">文章的自定义链接路径</small>
                </div>

                <div class="form-group">
                    <label for="category" class="form-label">分类</label>
                    <Select
                        v-model="post.categoryId"
                        :options="categories"
                        option-label="name"
                        option-value="id"
                        placeholder="选择分类"
                        show-clear
                    />
                </div>

                <div class="form-group">
                    <label for="tags" class="form-label">标签</label>
                    <AutoComplete
                        v-model="selectedTags"
                        multiple
                        :suggestions="filteredTags"
                        placeholder="输入标签..."
                        @complete="searchTags"
                    />
                    <small class="form-hint">输入标签名称并回车</small>
                </div>

                <div class="form-group">
                    <label for="summary" class="form-label">摘要</label>
                    <Textarea
                        id="summary"
                        v-model="post.summary"
                        rows="4"
                        placeholder="文章摘要..."
                        class="resize-none"
                    />
                </div>

                <div class="form-group">
                    <label for="cover" class="form-label">封面图 URL</label>
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
                        label="关闭"
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
import MarkdownIt from 'markdown-it'
import { useRoute, useRouter } from 'vue-router'

definePageMeta({
    layout: false,
})

const route = useRoute()
const router = useRouter()
const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
})

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

const renderedContent = computed(() => {
    return md.render(post.value.content || '')
})

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
        alert('请输入文章标题')
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
        alert('保存失败')
    } finally {
        saving.value = false
    }
}

const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
        published: '已发布',
        draft: '草稿',
        pending: '待审核',
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
}

.editor-input-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--p-surface-200);
    background-color: var(--p-surface-0);
}

.editor-textarea {
    flex: 1;
    width: 100%;
    padding: 1.5rem;
    resize: none;
    background: transparent;
    border: none;
    outline: none;
    font-family: monospace;
    font-size: 1.125rem;
    line-height: 1.6;
}

.editor-preview-container {
    flex: 1;
    overflow-y: auto;
    background-color: var(--p-surface-50);
    padding: 1.5rem;
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

/* Markdown Preview Styles */
.markdown-body {
    max-width: 100%;
    margin: 0 auto;

    :deep(h1) {
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 1rem;
    }

    :deep(h2) {
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: 0.75rem;
        margin-top: 1.5rem;
    }

    :deep(h3) {
        font-size: 1.25rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
        margin-top: 1rem;
    }

    :deep(p) {
        margin-bottom: 1rem;
        line-height: 1.6;
    }

    :deep(ul) {
        list-style-type: disc;
        padding-left: 1.25rem;
        margin-bottom: 1rem;
    }

    :deep(ol) {
        list-style-type: decimal;
        padding-left: 1.25rem;
        margin-bottom: 1rem;
    }

    :deep(blockquote) {
        border-left: 4px solid var(--p-surface-300);
        padding-left: 1rem;
        font-style: italic;
        margin: 1rem 0;
    }

    :deep(pre) {
        background-color: var(--p-surface-900);
        color: var(--p-surface-50);
        padding: 1rem;
        border-radius: 0.5rem;
        overflow-x: auto;
        margin-bottom: 1rem;
    }

    :deep(code) {
        background-color: var(--p-surface-200);
        padding: 0.2rem 0.4rem;
        border-radius: 0.25rem;
        font-family: monospace;
        font-size: 0.875rem;
    }

    :deep(img) {
        max-width: 100%;
        height: auto;
        border-radius: 0.5rem;
        margin: 1rem 0;
    }

    :deep(a) {
        color: var(--p-primary-500);
        text-decoration: none;

        &:hover {
            text-decoration: underline;
        }
    }
}

:global(.dark) {
    .editor-layout { background-color: var(--p-surface-950); }

    .top-bar {
        border-color: var(--p-surface-700);
        background-color: var(--p-surface-900);
    }

    .editor-input-container {
        border-color: var(--p-surface-700);
        background-color: var(--p-surface-900);
    }
    .editor-preview-container { background-color: var(--p-surface-950); }

    .markdown-body {
        :deep(code) { background-color: var(--p-surface-800); }
    }
}
</style>
