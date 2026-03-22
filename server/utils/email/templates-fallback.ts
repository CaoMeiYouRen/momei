export function getFallbackFragment(fragmentName: string): string {
    const fallbackFragments: Record<string, string> = {
        'verification-code': `
                <mj-section padding="30px 0">
                    <mj-column>
                        <mj-text align="center" font-size="18px" color="{{primaryColor}}" font-weight="600" padding="0 0 20px 0">
              {{verificationCodeTitle}}
                        </mj-text>
                        <mj-text align="center" padding="20px 0"
                                 font-size="36px"
                                 font-weight="bold"
                                 color="#ffffff"
                                 background-color="{{primaryColor}}"
                                 border-radius="12px"
                                 letter-spacing="4px"
                                 font-family="'Fira Code', 'JetBrains Mono', Monaco, Consolas, monospace">
                            {{verificationCode}}
                        </mj-text>
                        <mj-text align="center" font-size="14px" color="#64748b" padding="15px 0 0 0">
                          {{verificationCodeExpiryText}}
                        </mj-text>
                    </mj-column>
                </mj-section>
            `,
        'security-tip': `
                <mj-section padding="20px 0">
                    <mj-column>
                        <mj-text font-size="16px" color="#1e293b" font-weight="600" padding="0 0 10px 0">
                          {{securityTipTitle}}
                        </mj-text>
                        <mj-text font-size="14px" color="#334155" padding="0 0 20px 20px"
                                 background-color="#f0fdf4"
                                 border-left="4px solid #16a34a"
                                 border-radius="6px">
                            {{securityTip}}
                        </mj-text>
                    </mj-column>
                </mj-section>
            `,
        'action-message': `
                <mj-section padding="20px 0">
                    <mj-column>
                        <mj-text font-size="16px" color="#334155" padding="0 0 30px 0">
                            {{message}}
                        </mj-text>
                        <mj-button background-color="{{primaryColor}}"
                                   color="#ffffff"
                                   font-size="16px"
                                   font-weight="600"
                                   padding="15px 0"
                                   border-radius="8px"
                                   href="{{actionUrl}}">
                            {{buttonText}}
                        </mj-button>
                    </mj-column>
                </mj-section>
            `,
        'important-reminder': `
                <mj-section padding="20px 0">
                    <mj-column>
                        <mj-text font-size="14px" color="#334155" padding="0 0 10px 0">
                          <strong>{{cannotClickButtonTitle}}</strong>{{cannotClickButtonHint}}
                        </mj-text>
                        <mj-text font-size="12px"
                                 color="#64748b"
                                 font-family="monospace"
                                 padding="10px"
                                 background-color="#f8fafc"
                                 border-radius="4px">
                            {{actionUrl}}
                        </mj-text>
                        <mj-text font-size="16px" color="#334155" padding="20px 0 0 0">
                          <strong>{{importantReminderTitle}}</strong><br/>
                            {{reminderContent}}
                        </mj-text>
                    </mj-column>
                </mj-section>
            `,
        'simple-message': `
                <mj-section padding="20px 0">
                    <mj-column>
                        <mj-text font-size="16px" color="#334155" padding="0 0 20px 0">
                            {{message}}
                        </mj-text>
                        <mj-text font-size="14px" color="#64748b" padding="0 0 20px 0">
                            {{extraInfo}}
                        </mj-text>
                    </mj-column>
                </mj-section>
            `,
    }

    return fallbackFragments[fragmentName] || `
            <mj-section padding="20px 0">
                <mj-column>
                    <mj-text font-size="16px" color="#4a5568">
                        {{message}}
                    </mj-text>
                </mj-column>
            </mj-section>
        `
}

export function getBaseTemplateFallback(): string {
    return `
<mjml>
  <mj-head>
    <mj-title>{{title}}</mj-title>
    <mj-preview>{{preheader}}</mj-preview>
    <mj-attributes>
      <mj-all font-family="'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" />
    </mj-attributes>
    <mj-style inline="inline">
      .primary-color { color: #1e293b !important; }
      .primary-bg { background-color: #1e293b !important; }
      .code-highlight {
        background: linear-gradient(135deg, #1e293b 0%, #334155 100%) !important;
        color: #ffffff !important;
        font-weight: bold !important;
        padding: 20px 40px !important;
        border-radius: 12px !important;
        letter-spacing: 4px !important;
        font-family: Monaco, Consolas, 'Lucida Console', monospace !important;
      }
    </mj-style>
  </mj-head>
  <mj-body background-color="#f8fafc">
    <mj-section background-color="#ffffff" padding="0">
      <mj-column>
        <!-- Header -->
        <mj-section background-color="#1e293b" padding="40px 20px">
          <mj-column>
            <mj-text align="center" color="#ffffff" font-size="32px" font-weight="bold">
              {{appName}}
            </mj-text>
            <mj-text align="center" color="rgba(255,255,255,0.9)" font-size="16px" font-weight="400" padding="8px 0 0 0">
              {{headerSubtitle}}
            </mj-text>
          </mj-column>
        </mj-section>

        <!-- Content -->
        <mj-section padding="40px 30px">
          <mj-column>
            <mj-text font-size="20px" color="#2d3748" font-weight="600" padding="0 0 20px 0">
              {{greeting}}
            </mj-text>

            <!-- Main Content Area -->
            {{mainContent}}

          </mj-column>
        </mj-section>

        <!-- Footer -->
        <mj-section background-color="#f7fafc" padding="30px" border-top="1px solid #e2e8f0">
          <mj-column>
            <mj-text align="center" font-size="14px" color="#718096" padding="0 0 15px 0">
              {{helpText}}
            </mj-text>
            <mj-text align="center" font-size="14px" padding="0 0 20px 0">
              <a href="{{contactEmail}}" style="color: #1e293b; text-decoration: none; margin: 0 12px;">{{contactLinkLabel}}</a>
              <a href="{{baseUrl}}/privacy" style="color: #1e293b; text-decoration: none; margin: 0 12px;">{{privacyPolicyLabel}}</a>
              <a href="{{baseUrl}}/terms" style="color: #1e293b; text-decoration: none; margin: 0 12px;">{{termsLabel}}</a>
            </mj-text>
            <mj-text align="center" font-size="12px" color="#a0aec0" padding="0">
              © {{currentYear}} {{appName}}. {{allRightsReserved}}
            </mj-text>
            <mj-text align="center" font-size="11px" color="#cbd5e0" padding="10px 0 0 0">
              {{footerNote}}
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`
}

export function getEmailVerificationFallback(): string {
    return `
<mjml>
  <mj-head>
    <mj-title>{{title}}</mj-title>
    <mj-preview>{{preheader}}</mj-preview>
    <mj-attributes>
      <mj-all font-family="Arial, sans-serif" />
    </mj-attributes>
    <mj-style inline="inline">
      .primary-color { color: #1e293b !important; }
      .primary-bg { background-color: #1e293b !important; }
    </mj-style>
  </mj-head>
  <mj-body background-color="#f8fafc">
    <mj-section background-color="#ffffff" padding="0">
      <mj-column>
        <!-- Header -->
        <mj-section background-color="#1e293b" padding="40px 20px">
          <mj-column>
            <mj-text align="center" color="#ffffff" font-size="28px" font-weight="bold">
              {{appName}}
            </mj-text>
            <mj-text align="center" color="#ffffff" font-size="16px" font-weight="400" padding-top="8px">
              {{headerSubtitle}}
            </mj-text>
          </mj-column>
        </mj-section>

        <!-- Content -->
        <mj-section padding="40px 30px">
          <mj-column>
            <mj-text font-size="18px" color="#2d3748" padding-bottom="20px">
              {{greeting}}
            </mj-text>
            <mj-text font-size="16px" color="#4a5568" padding-bottom="30px">
              {{message}}
            </mj-text>

            <!-- CTA Button -->
            <mj-button background-color="#1e293b" color="#ffffff" font-size="16px" font-weight="600" padding="20px 0" border-radius="8px" href="{{actionUrl}}">
              {{buttonText}}
            </mj-button>

            <!-- Alternative Link -->
            <mj-text font-size="14px" color="#4a5568" padding="30px 0 10px 0">
              <strong>{{cannotClickButtonTitle}}</strong>{{cannotClickButtonHint}}
            </mj-text>
            <mj-text font-size="12px" color="#718096" font-family="monospace" padding="0 0 20px 0" background-color="#f7fafc">
              {{actionUrl}}
            </mj-text>

            <mj-text font-size="16px" color="#4a5568" padding-top="30px">
              <strong>{{importantReminderTitle}}</strong><br/>
              {{reminderContent}}
            </mj-text>
          </mj-column>
        </mj-section>

        <!-- Footer -->
        <mj-section background-color="#f7fafc" padding="30px" border-top="1px solid #e2e8f0">
          <mj-column>
            <mj-text align="center" font-size="14px" color="#718096" padding-bottom="10px">
              {{helpText}}
            </mj-text>
            <mj-text align="center" font-size="14px" padding-bottom="20px">
              <a href="{{contactEmail}}" style="color: #1e293b; text-decoration: none; margin: 0 10px;">{{contactLinkLabel}}</a>
              <a href="{{baseUrl}}/privacy" style="color: #1e293b; text-decoration: none; margin: 0 10px;">{{privacyPolicyLabel}}</a>
              <a href="{{baseUrl}}/terms" style="color: #1e293b; text-decoration: none; margin: 0 10px;">{{termsLabel}}</a>
            </mj-text>
            <mj-text align="center" font-size="12px" color="#a0aec0">
              © {{currentYear}} {{appName}}. {{allRightsReserved}}
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`
}

export function getCodeEmailFallback(): string {
    return `
<mjml>
  <mj-head>
    <mj-title>{{title}}</mj-title>
    <mj-preview>{{preheader}}</mj-preview>
    <mj-attributes>
      <mj-all font-family="Arial, sans-serif" />
    </mj-attributes>
    <mj-style inline="inline">
      .primary-color { color: #1e293b !important; }
      .code-highlight {
        background: linear-gradient(135deg, #1e293b 0%, #334155 100%) !important;
        color: #ffffff !important;
        font-weight: bold !important;
        padding: 20px 40px !important;
        border-radius: 12px !important;
        letter-spacing: 4px !important;
        font-family: Monaco, Consolas, 'Lucida Console', monospace !important;
      }
    </mj-style>
  </mj-head>
  <mj-body background-color="#f8fafc">
    <mj-section background-color="#ffffff" padding="0">
      <mj-column>
        <!-- Header -->
        <mj-section background-color="#1e293b" padding="40px 20px">
          <mj-column>
            <mj-text align="center" color="#ffffff" font-size="32px" font-weight="bold">
              {{appName}}
            </mj-text>
            <mj-text align="center" color="rgba(255,255,255,0.9)" font-size="16px" font-weight="400" padding="8px 0 0 0">
              {{headerSubtitle}}
            </mj-text>
          </mj-column>
        </mj-section>

        <!-- Content -->
        <mj-section padding="40px 30px">
          <mj-column>
            <mj-text font-size="20px" color="#2d3748" font-weight="600" padding="0 0 20px 0">
              {{greeting}}
            </mj-text>
            <mj-text font-size="16px" color="#4a5568" padding="0 0 20px 0">
              {{message}}
            </mj-text>

            <!-- Verification Code -->
            <mj-text align="center" padding="20px 0" css-class="code-highlight">
              {{verificationCode}}
            </mj-text>

            <!-- Expiry Info -->
            <mj-text font-size="14px" color="#718096" align="center" padding="0 0 30px 0">
              {{verificationCodeExpiryText}}
            </mj-text>

            <!-- Security Tips -->
            <mj-text font-size="14px" color="#234e52" font-weight="600" padding="0 0 8px 0">
              {{securityTipTitle}}
            </mj-text>
            <mj-text font-size="14px" color="#234e52" padding="0 0 20px 0">
              {{securityTip}}
            </mj-text>
          </mj-column>
        </mj-section>

        <!-- Footer -->
        <mj-section background-color="#f7fafc" padding="30px" border-top="1px solid #e2e8f0">
          <mj-column>
            <mj-text align="center" font-size="14px" color="#718096" padding="0 0 15px 0">
              {{helpText}}
            </mj-text>
            <mj-text align="center" font-size="14px" padding="0 0 20px 0">
              <a href="{{contactEmail}}" style="color: #1e293b; text-decoration: none; margin: 0 12px;">{{contactLinkLabel}}</a>
              <a href="{{baseUrl}}/privacy" style="color: #1e293b; text-decoration: none; margin: 0 12px;">{{privacyPolicyLabel}}</a>
              <a href="{{baseUrl}}/terms" style="color: #1e293b; text-decoration: none; margin: 0 12px;">{{termsLabel}}</a>
            </mj-text>
            <mj-text align="center" font-size="12px" color="#a0aec0" padding="0">
              © {{currentYear}} {{appName}}. {{allRightsReserved}}
            </mj-text>
            <mj-text align="center" font-size="11px" color="#cbd5e0" padding="10px 0 0 0">
              {{footerNote}}
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`
}

export function getDefaultFallback(): string {
    return `
<mjml>
  <mj-head>
    <mj-title>{{title}}</mj-title>
    <mj-preview>{{preheader}}</mj-preview>
  </mj-head>
  <mj-body background-color="#f8fafc">
    <mj-section background-color="#ffffff" padding="40px">
      <mj-column>
        <mj-text align="center" font-size="24px" font-weight="bold" color="#1e293b" padding-bottom="20px">
          {{appName}}
        </mj-text>
        <mj-text font-size="16px" color="#333333" padding="0 0 20px 0">
          {{message}}
        </mj-text>
        <mj-text align="center" font-size="12px" color="#666666" padding-top="40px">
          © {{currentYear}} {{appName}}. {{allRightsReserved}}
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`
}

export function getFallbackMjmlTemplate(templateName: string): string {
    const fallbackTemplates: Record<string, string> = {
        'base-template': getBaseTemplateFallback(),
        'email-verification': getEmailVerificationFallback(),
        'action-email': getEmailVerificationFallback(),
        'code-email': getCodeEmailFallback(),
        default: getDefaultFallback(),
    }

    return fallbackTemplates[templateName] || fallbackTemplates.default || ''
}

export function generateFallbackHtml(title: string, safeData: any): string {
    const primaryColor = '#1e293b'
    const resolvedTitle = title || '墨梅博客'
    const verificationCodeExpiryText = String(safeData.verificationCodeExpiryText || '请在 {{expiresIn}} 分钟内使用此验证码')
        .replace(/\{\{expiresIn\}\}|\{expiresIn\}/g, String(safeData.expiresIn || '10'))
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
  <title>${resolvedTitle}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f8fafc;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 0;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, ${primaryColor} 0%, #334155 100%);
            text-align: center;
            padding: 40px 20px;
            color: white;
        }
        .logo {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        .subtitle {
            font-size: 16px;
            opacity: 0.9;
        }
        .content {
            padding: 40px 30px;
            line-height: 1.6;
        }
        .greeting {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #2d3748;
        }
        .message {
            font-size: 16px;
            margin-bottom: 30px;
            color: #4a5568;
        }
        .code-section {
            text-align: center;
            margin: 30px 0;
        }
        .code-box {
            background: linear-gradient(135deg, ${primaryColor} 0%, #334155 100%);
            color: white;
            font-size: 32px;
            font-weight: bold;
            padding: 25px 40px;
            display: inline-block;
            border-radius: 12px;
            letter-spacing: 4px;
            font-family: 'Courier New', Monaco, Consolas, monospace;
            box-shadow: 0 4px 12px rgba(30, 41, 59, 0.3);
            margin: 10px 0;
        }
        .code-note {
            font-size: 14px;
            color: #718096;
            margin-top: 15px;
        }
        .button {
            display: inline-block;
            padding: 16px 32px;
            background: linear-gradient(135deg, ${primaryColor} 0%, #334155 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
            transition: transform 0.2s;
        }
        .button:hover {
            transform: translateY(-1px);
        }
        .security-tip {
            background: linear-gradient(135deg, #e6fffa 0%, #f0fff4 100%);
            padding: 20px;
            border-left: 4px solid #38b2ac;
            border-radius: 8px;
            margin: 30px 0;
        }
        .security-tip-title {
            font-weight: 600;
            color: #234e52;
            margin-bottom: 8px;
            font-size: 16px;
        }
        .security-tip-content {
            color: #234e52;
            font-size: 14px;
            line-height: 1.5;
            white-space: pre-line;
        }
        .footer {
            background: #f7fafc;
            padding: 30px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
        }
        .footer-links {
            margin-bottom: 20px;
        }
        .footer-links a {
            color: ${primaryColor};
            text-decoration: none;
            margin: 0 12px;
            font-size: 14px;
        }
        .footer-copyright {
            font-size: 12px;
            color: #a0aec0;
            margin-bottom: 10px;
        }
        .footer-note {
            font-size: 11px;
            color: #cbd5e0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">${safeData.appName}</div>
          <div class="subtitle">${safeData.headerSubtitle || '专业 · 高性能 · 国际化博客平台'}</div>
        </div>
        <div class="content">
          <div class="greeting">${safeData.greeting || '您好！'}</div>
            <div class="message">${safeData.message}</div>

            ${safeData.verificationCode
                    ? `
            <div class="code-section">
                <div class="code-box">${safeData.verificationCode}</div>
            ${safeData.expiresIn ? `<div class="code-note">${verificationCodeExpiryText}</div>` : ''}
            </div>
            `
                    : ''
            }

            ${safeData.actionUrl
                    ? `
            <div style="text-align: center;">
                <a href="${safeData.actionUrl}" class="button">${safeData.buttonText}</a>
            </div>
            <div style="margin-top: 20px; font-size: 14px; color: #4a5568;">
              <strong>${safeData.cannotClickButtonTitle || '无法点击按钮？'}</strong>${safeData.cannotClickButtonHint || '请复制以下链接到浏览器地址栏：'}<br/>
                <div style="background: #f7fafc; padding: 10px; border-radius: 4px; margin-top: 8px; font-family: monospace; font-size: 12px; color: #718096; word-break: break-all;">
                    ${safeData.actionUrl}
                </div>
            </div>
            `
                    : ''
            }

            ${safeData.securityTip
                    ? `
            <div class="security-tip">
              <div class="security-tip-title">${safeData.securityTipTitle || '🛡️ 安全提示'}</div>
                <div class="security-tip-content">${safeData.securityTip}</div>
            </div>
            `
                    : ''
            }
        </div>
        <div class="footer">
            <div style="font-size: 14px; color: #718096; margin-bottom: 12px;">${safeData.helpText || '需要帮助？联系我们的客服团队'}</div>
            <div class="footer-links">
              <a href="${safeData.contactEmail}">${safeData.contactLinkLabel || '联系方式'}</a>
              <a href="${safeData.baseUrl}/privacy">${safeData.privacyPolicyLabel || '隐私政策'}</a>
              <a href="${safeData.baseUrl}/terms">${safeData.termsLabel || '服务条款'}</a>
            </div>
            <div class="footer-copyright">© ${safeData.currentYear} ${safeData.appName}. ${safeData.allRightsReserved || '保留所有权利。'}</div>
            <div class="footer-note">${safeData.footerNote}</div>
        </div>
    </div>
</body>
</html>`
}
