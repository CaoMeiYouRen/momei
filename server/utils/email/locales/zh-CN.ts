/**
 * 中文邮件国际化配置
 */
export const emailLocalesZhCN = {
    verification: {
        title: '验证您的 {appName} 邮箱地址',
        preheader: '欢迎注册 {appName}！请验证您的邮箱地址以完成注册。',
        headerIcon: '🔐',
        message: '感谢您注册 <strong>{appName}</strong>！为了确保您的账户安全，请点击下方按钮验证您的邮箱地址。',
        buttonText: '验证邮箱地址',
        reminderContent:
            '• 此验证链接将在 <strong>24 小时</strong>后过期<br/>• 如果您没有注册 {appName} 账户，请忽略此邮件<br/>• 请勿将此链接分享给他人，以保护您的账户安全',
        securityTip: '{appName} 永远不会通过邮件要求您提供密码、验证码或其他敏感信息。',
    },

    passwordReset: {
        title: '重置您的 {appName} 密码',
        preheader: '有人请求重置您的密码，如果是您本人操作请点击链接。',
        headerIcon: '🔑',
        message:
            '有人请求重置您的 <strong>{appName}</strong> 账户密码。如果是您本人操作，请点击下方按钮重置密码：',
        buttonText: '重置密码',
        reminderContent:
            '• 此重置链接将在 <strong>1 小时</strong>后过期<br/>• 如果不是您本人操作，请立即检查您的账户安全<br/>• 建议修改密码并启用两步验证',
        securityTip: '如果您没有请求重置密码，请忽略此邮件并检查您的账户安全。',
    },

    loginOTP: {
        title: '您的 {appName} 登录验证码',
        preheader: '这是您的一次性登录验证码',
        headerIcon: '🔓',
        message: '您正在尝试登录 <strong>{appName}</strong>。请使用以下验证码完成登录：',
        reminderContent:
            '• 此验证码将在 <strong>{expiresIn} 分钟</strong>后过期<br/>• 验证码仅对本次登录有效<br/>• 请勿将验证码分享给他人',
        securityTip: '如果不是您本人操作，请忽略此邮件并检查您的账户安全。',
    },

    emailVerificationOTP: {
        title: '验证您的 {appName} 邮箱地址',
        preheader: '您的邮箱验证码已发送',
        headerIcon: '📧',
        message:
            '您正在验证邮箱地址以关联到您的 <strong>{appName}</strong> 账户。请使用以下验证码完成验证：',
        reminderContent:
            '• 此验证码将在 <strong>{expiresIn} 分钟</strong>后过期<br/>• 如果您没有请求邮箱验证，请忽略此邮件<br/>• 请勿将验证码分享给他人',
        securityTip: '{appName} 永远不会通过邮件主动要求您提供验证码。',
    },

    passwordResetOTP: {
        title: '重置您的 {appName} 密码',
        preheader: '您的密码重置验证码已发送',
        headerIcon: '🔐',
        message: '您正在重置您的 <strong>{appName}</strong> 账户密码。请使用以下验证码完成重置：',
        reminderContent:
            '• 此验证码将在 <strong>{expiresIn} 分钟</strong>后过期<br/>• 如果不是您本人操作，请立即检查您的账户安全<br/>• 请勿将验证码分享给他人',
        securityTip: '如果您没有请求重置密码，请忽略此邮件并检查您的账户安全。',
    },

    emailChangeVerification: {
        title: '确认您的新邮箱地址',
        preheader: '确认新邮箱地址以完成邮箱变更',
        headerIcon: '✉️',
        message:
            '您正在将您的 <strong>{appName}</strong> 账户邮箱地址更改为此邮箱。请点击下方按钮确认：',
        buttonText: '确认新邮箱',
        reminderContent:
            '• 此确认链接将在 <strong>24 小时</strong>后过期<br/>• 邮箱变更只有在您完成确认后才会生效<br/>• 如果您没有请求更改邮箱，请忽略此邮件',
        securityTip: '{appName} 永远不会通过邮件要求您提供密码或其他敏感信息。',
    },

    magicLink: {
        title: '您的 {appName} 无密码登录链接',
        preheader: '点击链接快速登录',
        headerIcon: '🔗',
        message: '您请求了无密码登录。请点击下方链接使用您的 <strong>{appName}</strong> 账户登录：',
        buttonText: '登录我的账户',
        reminderContent:
            '• 此登录链接将在 <strong>30 分钟</strong>后过期<br/>• 此链接仅对您本人有效<br/>• 如果您没有请求登录，请忽略此邮件',
        securityTip: '如果不是您本人操作，请忽略此邮件并检查您的账户安全。',
    },

    securityNotification: {
        title: '{appName} 安全通知',
        preheader: '您的账户已检测到新的登录活动',
        headerIcon: '🛡️',
        message: '我们检测到您的 <strong>{appName}</strong> 账户有新的登录活动：',
        reminderContent:
            '• 如果这是您本人的操作，您可以忽略此邮件<br/>• 如果您没有认可此操作，请立即更改密码<br/>• 为了保护您的账户，我们建议启用两步验证',
        securityTip: '如果您对账户安全有任何疑虑，请立即联系我们：{contactEmail}',
    },

    subscriptionConfirmation: {
        title: '订阅确认 - {appName}',
        preheader: '您已成功订阅 {appName}',
        headerIcon: '🔔',
        message: '感谢您订阅 <strong>{appName}</strong>！您已成功订阅我们的邮件通讯。',
        reminderContent:
            '• 您将定期收到我们的最新文章和更新<br/>• 您可以随时通过邮件底部的"取消订阅"链接取消订阅<br/>• 如果您希望修改订阅设置，请访问您的账户偏好',
        securityTip: '此邮件地址与您的订阅相关联。请勿将此邮件转发给他人。',
    },

    weeklyNewsletter: {
        title: '{appName} 周刊 - 最新文章精选',
        preheader: '本周精彩内容不容错过',
        headerIcon: '📰',
        message: '这是您的 <strong>{appName}</strong> 每周文章摘要。以下是本周的热门文章：',
    },

    adminAlert: {
        title: '{appName} 站务通知',
        preheader: '您收到一则来自 {appName} 的系统站务提醒',
        headerIcon: '📢',
        NEW_USER: {
            subject: '新订阅/用户注册通知',
            message: '系统检测到新的用户注册或邮件订阅：<strong>{email}</strong>',
        },
        NEW_COMMENT: {
            subject: '新评论待审核通知',
            message: '文章《{postTitle}》收到来自 <strong>{author}</strong> 的新评论：<br/><br/>{content}',
        },
    },

    commonParameters: {
        appName: 'Momei',
        baseUrl: '{baseUrl}',
        contactEmail: '{contactEmail}',
        currentYear: '{currentYear}',
        unsubscribeLink: '取消订阅',
        viewInBrowser: '在浏览器中查看',
        allRightsReserved: '版权所有',
    },
}
