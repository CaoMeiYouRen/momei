/**
 * 繁體中文郵件國際化配置
 */
export const emailLocalesZhTW = {
    verification: {
        title: '驗證您的 {appName} 電子郵件地址',
        preheader: '歡迎註冊 {appName}！請驗證您的電子郵件地址以完成註冊。',
        headerIcon: '🔐',
        message: '感謝您註冊 <strong>{appName}</strong>！為了確保帳號安全，請點擊下方按鈕驗證您的電子郵件地址。',
        buttonText: '驗證電子郵件地址',
        reminderContent:
            '• 此驗證連結將於 <strong>24 小時</strong>後失效<br/>• 如果您沒有註冊 {appName} 帳號，請忽略此郵件<br/>• 請勿將此連結分享給他人，以保護您的帳號安全',
        securityTip: '{appName} 絕不會透過郵件要求您提供密碼、驗證碼或其他敏感資訊。',
    },

    passwordReset: {
        title: '重設您的 {appName} 密碼',
        preheader: '有人請求重設您的密碼，如果是您本人操作請點擊連結。',
        headerIcon: '🔑',
        message:
            '有人請求重設您的 <strong>{appName}</strong> 帳號密碼。如果是您本人操作，請點擊下方按鈕重設密碼：',
        buttonText: '重設密碼',
        reminderContent:
            '• 此重設連結將於 <strong>1 小時</strong>後失效<br/>• 如果不是您本人操作，請立即檢查帳號安全<br/>• 建議變更密碼並啟用兩步驟驗證',
        securityTip: '如果您沒有請求重設密碼，請忽略此郵件並檢查您的帳號安全。',
    },

    loginOTP: {
        title: '您的 {appName} 登入驗證碼',
        preheader: '這是您的一次性登入驗證碼',
        headerIcon: '🔓',
        message: '您正在嘗試登入 <strong>{appName}</strong>。請使用以下驗證碼完成登入：',
        reminderContent:
            '• 此驗證碼將於 <strong>{expiresIn} 分鐘</strong>後失效<br/>• 驗證碼僅適用於本次登入<br/>• 請勿將驗證碼分享給他人',
        securityTip: '如果不是您本人操作，請忽略此郵件並檢查您的帳號安全。',
    },

    emailVerificationOTP: {
        title: '驗證您的 {appName} 電子郵件地址',
        preheader: '您的電子郵件驗證碼已寄出',
        headerIcon: '📧',
        message:
            '您正在驗證要綁定到 <strong>{appName}</strong> 帳號的電子郵件地址。請使用以下驗證碼完成驗證：',
        reminderContent:
            '• 此驗證碼將於 <strong>{expiresIn} 分鐘</strong>後失效<br/>• 如果您沒有請求驗證電子郵件，請忽略此郵件<br/>• 請勿將驗證碼分享給他人',
        securityTip: '{appName} 絕不會透過郵件主動向您索取驗證碼。',
    },

    passwordResetOTP: {
        title: '重設您的 {appName} 密碼',
        preheader: '您的密碼重設驗證碼已寄出',
        headerIcon: '🔐',
        message: '您正在重設 <strong>{appName}</strong> 帳號密碼。請使用以下驗證碼完成重設：',
        reminderContent:
            '• 此驗證碼將於 <strong>{expiresIn} 分鐘</strong>後失效<br/>• 如果不是您本人操作，請立即檢查帳號安全<br/>• 請勿將驗證碼分享給他人',
        securityTip: '如果您沒有請求重設密碼，請忽略此郵件並檢查您的帳號安全。',
    },

    emailChangeVerification: {
        title: '確認您的新電子郵件地址',
        preheader: '確認新電子郵件地址以完成信箱變更',
        headerIcon: '✉️',
        message:
            '您正在將 <strong>{appName}</strong> 帳號的電子郵件地址變更為此信箱。請點擊下方按鈕確認：',
        buttonText: '確認新信箱',
        reminderContent:
            '• 此確認連結將於 <strong>24 小時</strong>後失效<br/>• 完成確認後才會正式變更電子郵件地址<br/>• 如果您沒有請求變更電子郵件，請忽略此郵件',
        securityTip: '{appName} 絕不會透過郵件要求您提供密碼或其他敏感資訊。',
    },

    magicLink: {
        title: '您的 {appName} 免密碼登入連結',
        preheader: '點擊連結即可快速登入',
        headerIcon: '🔗',
        message: '您已請求免密碼登入。請點擊下方連結登入您的 <strong>{appName}</strong> 帳號：',
        buttonText: '登入我的帳號',
        reminderContent:
            '• 此登入連結將於 <strong>30 分鐘</strong>後失效<br/>• 此連結僅限您本人使用<br/>• 如果您沒有請求登入，請忽略此郵件',
        securityTip: '如果不是您本人操作，請忽略此郵件並檢查您的帳號安全。',
    },

    securityNotification: {
        title: '{appName} 安全通知',
        preheader: '您的帳號偵測到新的登入活動',
        headerIcon: '🛡️',
        message: '我們偵測到您的 <strong>{appName}</strong> 帳號有新的登入活動：',
        reminderContent:
            '• 如果這是您本人操作，您可以忽略此郵件<br/>• 如果您未授權此操作，請立即變更密碼<br/>• 為了保護您的帳號，建議啟用兩步驟驗證',
        securityTip: '如果您對帳號安全有任何疑慮，請立即聯絡我們：{contactEmail}',
    },

    subscriptionConfirmation: {
        title: '訂閱確認 - {appName}',
        preheader: '您已成功訂閱 {appName}',
        headerIcon: '🔔',
        message: '感謝您訂閱 <strong>{appName}</strong>！您已成功加入我們的電子報。',
        reminderContent:
            '• 您將定期收到最新文章與更新<br/>• 您可以隨時使用郵件底部的「取消訂閱」連結退訂<br/>• 如需調整訂閱設定，請前往您的帳號偏好設定',
        securityTip: '此電子郵件地址與您的訂閱綁定。請勿將此郵件轉寄給他人。',
    },

    weeklyNewsletter: {
        title: '{appName} 週刊 - 本週精選文章',
        preheader: '本週精彩內容不容錯過',
        headerIcon: '📰',
        message: '這是您的 <strong>{appName}</strong> 每週文章摘要。以下為本週熱門文章：',
    },

    marketingCampaign: {
        title: '{title} - {appName}',
        preheader: '{summary}',
        headerIcon: '✨',
        greeting: '親愛的訂閱者：',
        buttonText: '閱讀全文',
        author: '作者：',
        category: '分類：',
        publishedAt: '發佈時間：',
    },

    adminAlert: {
        title: '{appName} 站務通知',
        preheader: '您收到一則來自 {appName} 的系統站務提醒',
        headerIcon: '📢',
        NEW_USER: {
            subject: '新訂閱 / 使用者註冊通知',
            message: '系統偵測到新的使用者註冊或郵件訂閱：<strong>{email}</strong>',
        },
        NEW_COMMENT: {
            subject: '新留言待審核通知',
            message: '文章《{postTitle}》收到來自 <strong>{author}</strong> 的新留言：<br/><br/>{content}',
        },
    },

    commonParameters: {
        appName: 'Momei',
        baseUrl: '{baseUrl}',
        contactEmail: '{contactEmail}',
        currentYear: '{currentYear}',
        unsubscribeLink: '取消訂閱',
        viewInBrowser: '在瀏覽器中查看',
        allRightsReserved: '版權所有',
    },
}
