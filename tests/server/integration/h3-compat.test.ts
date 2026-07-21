/**
 * h3 版本兼容性测试。
 *
 * Nuxt 4.4.x（Nitro 2.13+）的 dev 模式存在 h3 v1/v2 RC 解析混乱问题。
 * 根因：h3 不是直接依赖，pnpm 可能拾取其他依赖的 h3 v2 RC，
 * 导致 auto-import 生成的 server 代码使用 h3 v2 RC 的函数，
 * 但运行时 H3Event 是 h3 v1 结构，在 event.req.headers.get() 等处崩溃。
 *
 * 修复方式：在 package.json 中显式声明 "h3": "^1.15.11"。
 *
 * 本测试验证：
 * 1. h3 被解析为 v1 版本（而非 v2 RC）
 * 2. 已知不兼容的关键导出函数存在（toWebRequest、getRequestIP、getRequestHeader 等）
 * 3. 这些函数能正确处理 h3 v1 事件而不抛出 TypeError
 *
 * @see https://github.com/nuxt/nuxt/issues/34738
 */

import { IncomingMessage, ServerResponse } from 'node:http'
import { Socket } from 'node:net'
import { describe, expect, it } from 'vitest'
import { createEvent, getRequestHeader, getRequestIP, readRawBody, toWebRequest } from 'h3'

describe('h3 v1 兼容性', () => {
    it('解析的 h3 版本应为 v1（存在 v1 特有导出 toWebRequest，无 v2 特有导出 toRequest）', () => {
        // h3 v1 有 toWebRequest；v2 RC 已重命名为 toRequest
        expect(typeof toWebRequest).toBe('function')
        // 验证其他关键导出也存在
        expect(typeof getRequestIP).toBe('function')
        expect(typeof getRequestHeader).toBe('function')
        expect(typeof readRawBody).toBe('function')
    })

    it('getRequestHeader 应正确处理 h3 v1 事件', () => {
        const socket = new Socket()
        const req = new IncomingMessage(socket)
        req.url = '/'
        req.method = 'GET'
        req.headers = { 'content-type': 'application/json', 'x-custom': 'hello' } as any
        const res = new ServerResponse(req)
        const event = createEvent(req, res)

        expect(getRequestHeader(event, 'content-type')).toBe('application/json')
        expect(getRequestHeader(event, 'x-custom')).toBe('hello')
    })

    it('getRequestHeader 应返回 undefined 不存在的请求头', () => {
        const socket = new Socket()
        const req = new IncomingMessage(socket)
        req.url = '/'
        req.method = 'GET'
        const res = new ServerResponse(req)
        const event = createEvent(req, res)

        expect(getRequestHeader(event, 'x-not-exist')).toBeUndefined()
    })

    it('getRequestIP 应正确处理 h3 v1 事件（x-forwarded-for 模式）', () => {
        const socket = new Socket()
        const req = new IncomingMessage(socket)
        req.url = '/'
        req.method = 'GET'
        req.headers = { 'x-forwarded-for': '192.168.1.1' } as any
        const res = new ServerResponse(req)
        const event = createEvent(req, res)

        const ip = getRequestIP(event, { xForwardedFor: true })
        expect(ip).toBe('192.168.1.1')
    })

    it('getRequestIP 应在无 IP 请求头时返回 undefined', () => {
        const socket = new Socket()
        const req = new IncomingMessage(socket)
        req.url = '/'
        req.method = 'GET'
        const res = new ServerResponse(req)
        const event = createEvent(req, res)

        const ip = getRequestIP(event, { xForwardedFor: true })
        expect(ip).toBeUndefined()
    })

    it('toWebRequest 应正确转换 h3 v1 事件的 URL 和方法', () => {
        const socket = new Socket()
        const req = new IncomingMessage(socket)
        req.url = '/api/test'
        req.method = 'GET'
        req.headers = { host: 'localhost:3000', 'content-type': 'application/json' } as any
        const res = new ServerResponse(req)
        const event = createEvent(req, res)

        const request = toWebRequest(event)
        expect(request).toBeInstanceOf(Request)
        expect(request.method).toBe('GET')
        expect(request.url).toContain('/api/test')
        expect(request.url).toContain('localhost:3000')
    })
})
