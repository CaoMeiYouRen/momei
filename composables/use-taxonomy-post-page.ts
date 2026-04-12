import { ref, computed, watch, type ComputedRef } from 'vue'
import type { ApiResponse } from '@/types/api'
import type { PostListData } from '@/types/post'

/** taxonomy 实体中与 i18n 参数绑定相关的最小结构 */
interface TaxonomyEntity {
    translations?: { language: string, slug: string }[]
}

interface UseTaxonomyPostPageOptions {
    /** 传给 /api/posts 的过滤字段名，category 页传 'category'，tag 页传 'tag' */
    filterKey: 'category' | 'tag'
    /** 当前路由 slug（来自页面的 computed） */
    slug: ComputedRef<string>
    /** taxonomy 实体数据（用于设置 i18n 路由参数） */
    entityData: ComputedRef<TaxonomyEntity | null | undefined>
}

/**
 * 封装 taxonomy（category / tag）详情页共有的帖子列表逻辑：
 * - 分页状态（page / limit / first）
 * - /api/posts 请求及其响应 computed
 * - 分页事件处理
 * - i18n 路由参数 watch
 *
 * 调用方仍需自行处理 taxonomy 实体自身的 fetch 与 SEO。
 */
export async function useTaxonomyPostPage(options: UseTaxonomyPostPageOptions) {
    const { filterKey, slug, entityData } = options
    const route = useRoute()
    const router = useRouter()
    const setI18nParams = useSetI18nParams()

    const page = ref(Number(route.query.page) || 1)
    const limit = ref(10)
    const first = ref((page.value - 1) * limit.value)

    const { data: postsData, pending: postsPending, error: postsError } = await useAppFetch<ApiResponse<PostListData>>('/api/posts', {
        query: {
            page,
            limit,
            [filterKey]: slug,
            status: 'published',
        },
        watch: [page, slug],
    })

    const posts = computed(() => postsData.value?.data?.items ?? [])
    const total = computed(() => postsData.value?.data?.total ?? 0)
    const totalPages = computed(() => postsData.value?.data?.totalPages ?? 0)

    // 将 taxonomy 实体的翻译信息同步到 i18n 路由参数，驱动语言切换器正确生成链接
    watch(entityData, (entity) => {
        if (!entity?.translations) {
            return
        }
        const params: Record<string, { slug: string }> = {}
        entity.translations.forEach((tr) => {
            params[tr.language] = { slug: tr.slug }
        })
        setI18nParams(params)
    }, { immediate: true })

    const onPageChange = (event: { page: number, first: number }) => {
        page.value = event.page + 1
        first.value = event.first
        void router.push({ query: { ...route.query, page: page.value } })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return { page, limit, first, posts, total, totalPages, postsPending, postsError, onPageChange }
}
