import { describe, expect, it } from 'vitest'
import { appendPostCopyrightNotice, buildPostCopyrightNotice } from './post-copyright'

describe('post-copyright', () => {
    it('builds localized chinese copyright notice', () => {
        const notice = buildPostCopyrightNotice({
            authorName: '草梅友仁',
            url: 'https://blog.cmyr.ltd/posts/test-post',
            license: 'cc-by-nc-sa',
            locale: 'zh-CN',
        })

        expect(notice.text).toContain('本文作者: 草梅友仁')
        expect(notice.text).toContain('本文链接: https://blog.cmyr.ltd/posts/test-post')
        expect(notice.text).toContain('版权声明: 本博客所有文章除特别声明外，均采用 CC BY-NC-SA 4.0（署名-非商业性使用-相同方式共享） 许可协议。转载请注明出处！')
        expect(notice.markdown).toContain('本文链接: [https://blog.cmyr.ltd/posts/test-post](https://blog.cmyr.ltd/posts/test-post)')
        expect(notice.markdown).toContain('[CC BY-NC-SA 4.0（署名-非商业性使用-相同方式共享）](https://creativecommons.org/licenses/by-nc-sa/4.0/)')
    })

    it('builds localized english copyright notice', () => {
        const notice = buildPostCopyrightNotice({
            authorName: 'CaoMeiYouRen',
            url: 'https://momei.app/en-US/posts/test-post',
            license: 'cc-by',
            locale: 'en-US',
        })

        expect(notice.text).toContain('Author: CaoMeiYouRen')
        expect(notice.text).toContain('Link: https://momei.app/en-US/posts/test-post')
        expect(notice.text).toContain('Copyright Notice: Except where otherwise noted, all articles in this blog are licensed under CC BY 4.0 (Attribution). Please credit the source when reposting!')
        expect(notice.markdown).toContain('Link: [https://momei.app/en-US/posts/test-post](https://momei.app/en-US/posts/test-post)')
        expect(notice.markdown).toContain('[CC BY 4.0 (Attribution)](https://creativecommons.org/licenses/by/4.0/)')
    })

    it('appends markdown notice after content', () => {
        const result = appendPostCopyrightNotice('正文内容', {
            authorName: '草梅友仁',
            url: 'https://blog.cmyr.ltd/posts/test-post',
            license: 'all-rights-reserved',
            locale: 'zh-CN',
        }, 'markdown')

        expect(result).toContain('正文内容')
        expect(result).toContain('----------')
        expect(result).toContain('版权声明: 所有权利保留（禁止转载）')
        expect(result).toContain('本文链接: [https://blog.cmyr.ltd/posts/test-post](https://blog.cmyr.ltd/posts/test-post)')
    })
})
