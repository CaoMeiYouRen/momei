import { describe, expect, it } from 'vitest'
import { AI_PROMPTS, formatPrompt } from './prompt'

describe('AI prompt utils', () => {
    describe('AI_PROMPTS', () => {
        it('should have SUGGEST_TITLES prompt', () => {
            expect(AI_PROMPTS.SUGGEST_TITLES).toBeDefined()
            expect(AI_PROMPTS.SUGGEST_TITLES).toContain('{{language}}')
            expect(AI_PROMPTS.SUGGEST_TITLES).toContain('{{content}}')
        })

        it('should have SUGGEST_SLUG prompt', () => {
            expect(AI_PROMPTS.SUGGEST_SLUG).toBeDefined()
            expect(AI_PROMPTS.SUGGEST_SLUG).toContain('{{title}}')
            expect(AI_PROMPTS.SUGGEST_SLUG).toContain('{{content}}')
        })

        it('should have SUMMARIZE prompt', () => {
            expect(AI_PROMPTS.SUMMARIZE).toBeDefined()
            expect(AI_PROMPTS.SUMMARIZE).toContain('{{language}}')
            expect(AI_PROMPTS.SUMMARIZE).toContain('{{maxLength}}')
            expect(AI_PROMPTS.SUMMARIZE).toContain('{{content}}')
        })

        it('should have TRANSLATE prompt', () => {
            expect(AI_PROMPTS.TRANSLATE).toBeDefined()
            expect(AI_PROMPTS.TRANSLATE).toContain('{{to}}')
            expect(AI_PROMPTS.TRANSLATE).toContain('{{content}}')
        })

        it('should have TRANSLATE_NAME prompt', () => {
            expect(AI_PROMPTS.TRANSLATE_NAME).toBeDefined()
            expect(AI_PROMPTS.TRANSLATE_NAME).toContain('{{to}}')
            expect(AI_PROMPTS.TRANSLATE_NAME).toContain('{{name}}')
        })

        it('should have SUGGEST_SLUG_FROM_NAME prompt', () => {
            expect(AI_PROMPTS.SUGGEST_SLUG_FROM_NAME).toBeDefined()
            expect(AI_PROMPTS.SUGGEST_SLUG_FROM_NAME).toContain('{{name}}')
        })

        it('should have GENERATE_SCAFFOLD prompt', () => {
            expect(AI_PROMPTS.GENERATE_SCAFFOLD).toBeDefined()
            expect(AI_PROMPTS.GENERATE_SCAFFOLD).toContain('{{language}}')
            expect(AI_PROMPTS.GENERATE_SCAFFOLD).toContain('{{snippets}}')
        })

        it('should have GENERATE_SCAFFOLD_V2 prompt', () => {
            expect(AI_PROMPTS.GENERATE_SCAFFOLD_V2).toBeDefined()
            expect(AI_PROMPTS.GENERATE_SCAFFOLD_V2).toContain('{{language}}')
            expect(AI_PROMPTS.GENERATE_SCAFFOLD_V2).toContain('{{audience}}')
            expect(AI_PROMPTS.GENERATE_SCAFFOLD_V2).toContain('{{template}}')
        })

        it('should have EXPAND_SECTION prompt', () => {
            expect(AI_PROMPTS.EXPAND_SECTION).toBeDefined()
            expect(AI_PROMPTS.EXPAND_SECTION).toContain('{{topic}}')
            expect(AI_PROMPTS.EXPAND_SECTION).toContain('{{sectionTitle}}')
            expect(AI_PROMPTS.EXPAND_SECTION).toContain('{{language}}')
        })
    })

    describe('formatPrompt', () => {
        it('should replace single variable', () => {
            const template = 'Hello {{name}}'
            const result = formatPrompt(template, { name: 'World' })
            expect(result).toBe('Hello World')
        })

        it('should replace multiple variables', () => {
            const template = 'Hello {{name}}, you are {{age}} years old'
            const result = formatPrompt(template, { name: 'Alice', age: 25 })
            expect(result).toBe('Hello Alice, you are 25 years old')
        })

        it('should keep unmatched variables unchanged', () => {
            const template = 'Hello {{name}}, {{greeting}}'
            const result = formatPrompt(template, { name: 'Bob' })
            expect(result).toBe('Hello Bob, {{greeting}}')
        })

        it('should handle empty variables object', () => {
            const template = 'Hello {{name}}'
            const result = formatPrompt(template, {})
            expect(result).toBe('Hello {{name}}')
        })

        it('should convert non-string values to strings', () => {
            const template = 'Count: {{count}}, Active: {{active}}'
            const result = formatPrompt(template, { count: 42, active: true })
            expect(result).toBe('Count: 42, Active: true')
        })

        it('should handle template without variables', () => {
            const template = 'Hello World'
            const result = formatPrompt(template, { name: 'Alice' })
            expect(result).toBe('Hello World')
        })

        it('should handle same variable multiple times', () => {
            const template = '{{name}} said: Hello {{name}}'
            const result = formatPrompt(template, { name: 'Alice' })
            expect(result).toBe('Alice said: Hello Alice')
        })

        it('should handle complex prompt with multiple variables', () => {
            const template = AI_PROMPTS.SUMMARIZE
            const result = formatPrompt(template, {
                language: 'English',
                maxLength: 200,
                content: 'This is a test content',
            })
            expect(result).toContain('English')
            expect(result).toContain('200')
            expect(result).toContain('This is a test content')
        })

        it('should handle variables with special characters in values', () => {
            const template = 'Message: {{message}}'
            const result = formatPrompt(template, { message: 'Hello $world! @2024' })
            expect(result).toBe('Message: Hello $world! @2024')
        })

        it('should handle null and undefined values', () => {
            const template = 'Value1: {{val1}}, Value2: {{val2}}'
            const result = formatPrompt(template, { val1: null, val2: undefined })
            expect(result).toBe('Value1: null, Value2: undefined')
        })

        it('should handle nested object values', () => {
            const template = 'User: {{user}}'
            const result = formatPrompt(template, { user: { name: 'Alice' } })
            expect(result).toBe('User: [object Object]')
        })

        it('should handle array values', () => {
            const template = 'Items: {{items}}'
            const result = formatPrompt(template, { items: [1, 2, 3] })
            expect(result).toBe('Items: 1,2,3')
        })
    })
})
