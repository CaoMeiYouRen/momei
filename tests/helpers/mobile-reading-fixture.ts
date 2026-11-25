/**
 * 阅读页窄屏夹具：覆盖「宽表 / 长 URL / 长行内代码 / 代码复制按钮」四类溢出与触达场景。
 *
 * 为什么用注入夹具：TEST_MODE 种子文章内容固定（改动它会牵动桌面 parity 参考态），
 * 而这三类场景只需验证 CSS 契约与复制交互，不需要真实文章数据。
 * 「表格包装行为」由 `utils/web/rendered-markdown.test.ts` 与 `components/article-content.test.ts`
 * 在单元层覆盖；本夹具在 DOM 中直接呈现包装后的结构，等价于组件挂载后的产物。
 */
export const MOBILE_READING_FIXTURE_HTML = `
<section class="reading-fixture">
    <h2>窄屏阅读夹具</h2>
    <p><a href="https://example.com/a/very/long/path/that/keeps/going/and/going/without/any/break/opportunity/until/the/end">https://example.com/a/very/long/path/that/keeps/going/and/going/without/any/break/opportunity/until/the/end</a></p>
    <p>行内代码：<code>const_identifier_that_is_very_long_without_breaks_0123456789_abcdefghijklmnopqrstuvwxyz</code></p>
    <div class="table-scroll" tabindex="0" role="region" aria-label="表格，可横向滚动">
        <table>
            <thead>
                <tr><th>路由</th><th>移动端视觉门禁</th><th>桌面 parity</th><th>预算（像素）</th><th>备注</th></tr>
            </thead>
            <tbody>
                <tr><td>/posts/hello-momei-test</td><td>390×844 / DPR 3</td><td>1440×900 / DPR 1</td><td>200</td><td>窄屏下应仅容器横向滚动</td></tr>
                <tr><td>/archives</td><td>390×844 / DPR 3</td><td>1440×900 / DPR 1</td><td>200</td><td>不产生页面级横向滚动</td></tr>
            </tbody>
        </table>
    </div>
    <pre class="hljs"><div class="copy-code-wrapper"><button class="copy-code-button" title="Copy Code" type="button"></button></div><code class="language-ts">const longLine = 'this line is intentionally long so that the code block scrolls horizontally on narrow screens without widening the page';</code></pre>
</section>
`
