import { z } from 'zod'
import { CampaignStatus, AdFormat, AdLocation } from '@/types/ad'

// ==================== Campaign Schemas ====================

const campaignBase = z.object({
    name: z.string().trim().min(1),
    status: z.enum(CampaignStatus).optional(),
    startDate: z.union([z.string(), z.date()]).nullable().optional(),
    endDate: z.union([z.string(), z.date()]).nullable().optional(),
    targeting: z.record(z.string(), z.unknown()).optional(),
})

export const createCampaignSchema = campaignBase.extend({
    targeting: campaignBase.shape.targeting.default({}),
})

export const updateCampaignSchema = campaignBase.partial().extend({
    impressions: z.number().int().min(0).optional(),
    clicks: z.number().int().min(0).optional(),
    revenue: z.number().min(0).optional(),
})

// ==================== Placement Schemas ====================

const placementBase = z.object({
    name: z.string().trim().min(1),
    format: z.enum(AdFormat),
    location: z.enum(AdLocation),
    adapterId: z.string().trim().min(1),
    metadata: z.record(z.string(), z.unknown()).optional(),
    enabled: z.boolean().optional(),
    targeting: z.record(z.string(), z.unknown()).optional(),
    priority: z.number().int().min(0).optional(),
    customCss: z.string().nullable().optional(),
    campaignId: z.string().nullable().optional(),
})

export const createPlacementSchema = placementBase.extend({
    metadata: placementBase.shape.metadata.default({}),
    targeting: placementBase.shape.targeting.default({}),
})

export const updatePlacementSchema = placementBase.partial()
