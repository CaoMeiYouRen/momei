import type { ExternalFeedSnapshot } from '@/types/external-feed'

const EXTERNAL_FEED_STORAGE_NAMESPACE = 'cache:external-feed'

export function buildExternalFeedCacheKey(sourceId: string, localeBucket: string) {
    return `${sourceId}:${localeBucket}`
}

export function isExternalFeedSnapshotFresh(snapshot: ExternalFeedSnapshot, now = new Date()) {
    return new Date(snapshot.expiresAt).getTime() > now.getTime()
}

export function canUseStaleExternalFeedSnapshot(snapshot: ExternalFeedSnapshot, now = new Date()) {
    return new Date(snapshot.staleUntil).getTime() > now.getTime()
}

export async function getExternalFeedSnapshot(sourceId: string, localeBucket: string) {
    const storage = useStorage(EXTERNAL_FEED_STORAGE_NAMESPACE)
    return await storage.getItem<ExternalFeedSnapshot>(buildExternalFeedCacheKey(sourceId, localeBucket))
}

export async function setExternalFeedSnapshot(snapshot: ExternalFeedSnapshot) {
    const storage = useStorage(EXTERNAL_FEED_STORAGE_NAMESPACE)
    await storage.setItem(buildExternalFeedCacheKey(snapshot.sourceId, snapshot.localeBucket), snapshot)
}
