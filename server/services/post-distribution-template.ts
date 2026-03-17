import { getSetting } from '@/server/services/setting'
import type { Post } from '@/types/post'
import { SettingKey } from '@/types/setting'
import {
    buildDistributionMaterialBundle,
    type DistributionMaterialBundle,
} from '@/utils/shared/distribution-template'

async function resolveDistributionSiteUrl() {
    const siteUrl = await getSetting(SettingKey.SITE_URL)
    if (siteUrl) {
        return siteUrl
    }

    const runtimeConfig = useRuntimeConfig()
    return runtimeConfig.public.siteUrl || 'https://momei.app'
}

export async function buildPostDistributionMaterialBundle(post: Post): Promise<DistributionMaterialBundle> {
    const [siteUrl, defaultLicense] = await Promise.all([
        resolveDistributionSiteUrl(),
        getSetting(SettingKey.POST_COPYRIGHT),
    ])

    return buildDistributionMaterialBundle(post, {
        siteUrl,
        defaultLicense,
    })
}
