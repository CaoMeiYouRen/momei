import { describe, it, expect, vi, beforeEach } from 'vitest'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerPostTools } from './posts'

// Mock MomeiApi
vi.mock('../lib/api', () => {
    return {
        MomeiApi: class {
            listPosts = vi.fn()
            getPost = vi.fn()
            createPost = vi.fn()
            updatePost = vi.fn()
            publishPost = vi.fn()
            deletePost = vi.fn()
        },
    }
})

describe('Post Tools Registration', () => {
    let server: McpServer

    beforeEach(() => {
        server = new McpServer({ name: 'test', version: '1.0.0' })
    })

    it('should register all post tools', () => {
        const config = { apiUrl: 'http://localhost:3000', apiKey: 'test', enableDangerousTools: false }

        // Use a spy to track registration
        const registerSpy = vi.spyOn(server, 'registerTool')

        registerPostTools(server, config)

        const registeredTools = registerSpy.mock.calls.map((call) => call[0])
        expect(registeredTools).toContain('list_posts')
        expect(registeredTools).toContain('get_post')
        expect(registeredTools).toContain('create_post')
        expect(registeredTools).toContain('update_post')
        expect(registeredTools).toContain('publish_post')
        expect(registeredTools).not.toContain('delete_post')
    })

    it('should register delete_post when enabled', () => {
        const config = { apiUrl: 'http://localhost:3000', apiKey: 'test', enableDangerousTools: true }
        const registerSpy = vi.spyOn(server, 'registerTool')

        registerPostTools(server, config)

        const registeredTools = registerSpy.mock.calls.map((call) => call[0])
        expect(registeredTools).toContain('delete_post')
    })
})
