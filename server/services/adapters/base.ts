import type { H3Event } from 'h3'
import { AdPlacement } from '@/server/entities/ad-placement'

/**
 * 广告适配器配置接口
 */
export interface AdAdapterConfig {
    [key: string]: any
}

/**
 * 广告适配器错误类
 */
export class AdError extends Error {
    constructor(message: string, public code?: string) {
        super(message)
        this.name = 'AdError'
    }
}

/**
 * 广告适配器基础接口
 * 所有广告平台适配器必须实现此接口
 *
 * @author Claude Code
 * @date 2026-03-03
 */
export interface IAdAdapter {
    /**
     * 适配器唯一标识符
     */
    readonly id: string

    /**
     * 适配器显示名称
     */
    readonly name: string

    /**
     * 支持的语言环境（* 表示支持所有）
     */
    readonly supportedLocales: string[]

    /**
     * 初始化适配器
     * @param config 平台特定配置
     */
    initialize(config: AdAdapterConfig): Promise<void>

    /**
     * 验证凭据是否有效
     */
    verifyCredentials(): Promise<boolean>

    /**
     * 获取广告脚本 HTML
     * 用于在页面 head 中加载的初始化脚本
     */
    getScript(): string

    /**
     * 获取广告位 HTML
     * @param placement 广告位配置
     */
    getPlacementHtml(placement: AdPlacement): string

    /**
     * 处理回调（验证、通知等）
     * @param event H3 事件对象
     */
    handleCallback?(event: H3Event): Promise<void>

    /**
     * 获取适配器配置
     */
    getConfig(): AdAdapterConfig

    /**
     * 检查是否支持指定的语言环境
     */
    supportsLocale(locale: string): boolean
}

/**
 * 抽象广告适配器基类
 * 提供通用实现和默认行为
 */
export abstract class BaseAdAdapter implements IAdAdapter {
    protected config: AdAdapterConfig = {}

    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly supportedLocales: string[] = ['*'],
    ) {}

    /**
     * 初始化适配器
     */
    async initialize(config: AdAdapterConfig): Promise<void> {
        this.config = config
        await this.validateConfig(config)
    }

    /**
     * 验证配置（子类可覆盖）
     */
    protected async validateConfig(_config: AdAdapterConfig): Promise<void> {
        // 默认实现，子类可覆盖以添加特定验证
    }

    /**
     * 验证凭据（子类必须实现）
     */
    abstract verifyCredentials(): Promise<boolean>

    /**
     * 获取广告脚本（子类必须实现）
     */
    abstract getScript(): string

    /**
     * 获取广告位 HTML（子类必须实现）
     */
    abstract getPlacementHtml(placement: AdPlacement): string

    /**
     * 获取适配器配置
     */
    getConfig(): AdAdapterConfig {
        return this.config
    }

    /**
     * 检查是否支持指定的语言环境
     */
    supportsLocale(locale: string): boolean {
        return this.supportedLocales.includes('*') || this.supportedLocales.includes(locale)
    }

    /**
     * 转义 HTML 特殊字符
     */
    protected escapeHtml(unsafe: string): string {
        return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
    }
}
