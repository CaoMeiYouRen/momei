/**
 * 日文邮件国际化配置
 */
export const emailLocalesJaJP = {
    verification: {
        title: '{appName} のメールアドレスを確認してください',
        preheader: '{appName} へようこそ。登録を完了するにはメールアドレスの確認が必要です。',
        headerIcon: '🔐',
        message:
            '<strong>{appName}</strong> へのご登録ありがとうございます。アカウント保護のため、以下のボタンからメールアドレスを確認してください。',
        buttonText: 'メールアドレスを確認',
        reminderContent:
            '• この確認リンクは <strong>24 時間</strong>で失効します<br/>• {appName} でアカウント登録を行っていない場合は、このメールを無視してください<br/>• アカウント保護のため、このリンクを他人と共有しないでください',
        securityTip:
            '{appName} がメールでパスワード、認証コード、その他の機密情報を求めることはありません。',
    },

    passwordReset: {
        title: '{appName} のパスワードをリセット',
        preheader: 'パスワード再設定のリクエストを受け付けました。ご本人の場合はリンクをクリックしてください。',
        headerIcon: '🔑',
        message:
            '<strong>{appName}</strong> アカウントのパスワード再設定リクエストを受け付けました。ご本人の場合は、以下のボタンから再設定してください。',
        buttonText: 'パスワードをリセット',
        reminderContent:
            '• この再設定リンクは <strong>1 時間</strong>で失効します<br/>• 心当たりがない場合は、すぐにアカウントの安全性を確認してください<br/>• パスワードの変更と二要素認証の有効化を推奨します',
        securityTip:
            'パスワード再設定を依頼していない場合は、このメールを無視し、アカウントの安全性をご確認ください。',
    },

    loginOTP: {
        title: '{appName} のログイン認証コード',
        preheader: 'ワンタイムのログイン認証コードです',
        headerIcon: '🔓',
        message:
            '<strong>{appName}</strong> にログインしようとしています。以下の認証コードを入力してログインを完了してください。',
        reminderContent:
            '• この認証コードは <strong>{expiresIn} 分</strong>で失効します<br/>• このコードは今回のログインにのみ有効です<br/>• このコードを他人と共有しないでください',
        securityTip:
            '心当たりがない場合は、このメールを無視し、アカウントの安全性をご確認ください。',
    },

    emailVerificationOTP: {
        title: '{appName} のメールアドレス確認',
        preheader: 'メール確認コードを送信しました',
        headerIcon: '📧',
        message:
            '<strong>{appName}</strong> アカウントに紐付けるメールアドレスを確認しています。以下の認証コードを入力して確認を完了してください。',
        reminderContent:
            '• この認証コードは <strong>{expiresIn} 分</strong>で失効します<br/>• メール確認を依頼していない場合は、このメールを無視してください<br/>• 認証コードを他人と共有しないでください',
        securityTip:
            '{appName} がメールで認証コードの提示を先に求めることはありません。',
    },

    passwordResetOTP: {
        title: '{appName} のパスワードをリセット',
        preheader: 'パスワード再設定用の認証コードを送信しました',
        headerIcon: '🔐',
        message:
            '<strong>{appName}</strong> アカウントのパスワードを再設定しています。以下の認証コードを入力して処理を完了してください。',
        reminderContent:
            '• この認証コードは <strong>{expiresIn} 分</strong>で失効します<br/>• 心当たりがない場合は、すぐにアカウントの安全性を確認してください<br/>• このコードを他人と共有しないでください',
        securityTip:
            'パスワード再設定を依頼していない場合は、このメールを無視し、アカウントの安全性をご確認ください。',
    },

    emailChangeVerification: {
        title: '新しいメールアドレスを確認してください',
        preheader: 'メールアドレス変更を完了するには、新しいメールアドレスの確認が必要です',
        headerIcon: '✉️',
        message:
            '<strong>{appName}</strong> アカウントのメールアドレスをこの宛先へ変更しようとしています。以下のボタンから確認してください。',
        buttonText: '新しいメールアドレスを確認',
        reminderContent:
            '• この確認リンクは <strong>24 時間</strong>で失効します<br/>• 確認が完了するまでメールアドレスは変更されません<br/>• 変更を依頼していない場合は、このメールを無視してください',
        securityTip:
            '{appName} がメールでパスワードやその他の機密情報を求めることはありません。',
    },

    magicLink: {
        title: '{appName} のパスワードレスログインリンク',
        preheader: 'リンクをクリックしてすぐにログインできます',
        headerIcon: '🔗',
        message:
            'パスワードレスログインをリクエストしました。以下のリンクから <strong>{appName}</strong> アカウントへログインしてください。',
        buttonText: 'アカウントにログイン',
        reminderContent:
            '• このログインリンクは <strong>30 分</strong>で失効します<br/>• このリンクはご本人専用です<br/>• ログインを依頼していない場合は、このメールを無視してください',
        securityTip:
            '心当たりがない場合は、このメールを無視し、アカウントの安全性をご確認ください。',
    },

    securityNotification: {
        title: '{appName} セキュリティ通知',
        preheader: 'アカウントで新しいログインアクティビティが検出されました',
        headerIcon: '🛡️',
        message:
            '<strong>{appName}</strong> アカウントで新しいログインアクティビティが検出されました。',
        reminderContent:
            '• ご本人による操作なら、このメールは無視して構いません<br/>• 身に覚えがない場合は、直ちにパスワードを変更してください<br/>• アカウント保護のため、二要素認証の有効化を推奨します',
        securityTip:
            'アカウントの安全性に不安がある場合は、すぐにお問い合わせください: {contactEmail}',
    },

    subscriptionConfirmation: {
        title: '購読が完了しました - {appName}',
        preheader: '{appName} の購読が正常に完了しました',
        headerIcon: '🔔',
        message:
            '<strong>{appName}</strong> の購読ありがとうございます。メールニュースレターの登録が完了しました。',
        reminderContent:
            '• 最新記事や更新情報を定期的にお届けします<br/>• メール下部の「購読解除」リンクからいつでも解除できます<br/>• 設定を変更したい場合は、アカウント設定ページをご利用ください',
        securityTip:
            'このメールアドレスは現在の購読設定に紐付いています。このメールを第三者に転送しないでください。',
    },

    weeklyNewsletter: {
        title: '{appName} 週間まとめ - 今週の注目記事',
        preheader: '今週のハイライトをお見逃しなく',
        headerIcon: '📰',
        message:
            '今週の <strong>{appName}</strong> 記事ダイジェストです。以下から注目記事をご確認ください。',
    },

    marketingCampaign: {
        title: '{title} - {appName}',
        preheader: '{summary}',
        headerIcon: '✨',
        greeting: '購読者の皆さまへ',
        buttonText: '全文を読む',
        author: '著者: ',
        category: 'カテゴリ: ',
        publishedAt: '公開日: ',
    },

    adminAlert: {
        title: '{appName} 管理通知',
        preheader: '{appName} からシステム管理通知を受信しました',
        headerIcon: '📢',
        NEW_USER: {
            subject: '新規ユーザー / 購読通知',
            message: '新しいユーザー登録またはメール購読が検出されました: <strong>{email}</strong>',
        },
        NEW_COMMENT: {
            subject: '審査待ちの新しいコメント',
            message: '記事「{postTitle}」に <strong>{author}</strong> さんから新しいコメントが届きました:<br/><br/>{content}',
        },
    },

    commonParameters: {
        appName: 'Momei',
        baseUrl: '{baseUrl}',
        contactEmail: '{contactEmail}',
        currentYear: '{currentYear}',
        unsubscribeLink: '購読を解除',
        viewInBrowser: 'ブラウザで表示',
        allRightsReserved: 'All Rights Reserved',
    },
}
