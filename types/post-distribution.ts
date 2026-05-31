import type {
    PostDistributionChannelState,
    PostDistributionTimelineEntry,
    PostHexoRepositoryProvider,
} from './post'

export type PostDistributionChannelSummary = PostDistributionChannelState

export interface HexoRepositorySyncChannelSummary extends PostDistributionChannelSummary {
    provider?: PostHexoRepositoryProvider | null
    owner?: string | null
    repo?: string | null
    branch?: string | null
    filePath?: string | null
    remoteSha?: string | null
}

export interface PostDistributionSummary {
    channels: {
        memos: PostDistributionChannelSummary
        wechatsync: PostDistributionChannelSummary
        hexoRepositorySync: HexoRepositorySyncChannelSummary
    }
    timeline: PostDistributionTimelineEntry[]
}
