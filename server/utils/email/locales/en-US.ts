/**
 * 英文邮件国际化配置
 */
export const emailLocalesEnUS = {
    verification: {
        title: 'Verify Your {appName} Email Address',
        preheader: 'Welcome to {appName}! Please verify your email address to complete registration.',
        headerIcon: '🔐',
        message:
            'Thank you for registering with <strong>{appName}</strong>! To ensure your account security, please click the button below to verify your email address.',
        buttonText: 'Verify Email Address',
        reminderContent:
            '• This verification link will expire in <strong>24 hours</strong><br/>• If you did not register an account with {appName}, please ignore this email<br/>• Do not share this link with others to protect your account',
        securityTip:
            '{appName} will never ask you for your password, verification code, or other sensitive information via email.',
    },

    passwordReset: {
        title: 'Reset Your {appName} Password',
        preheader: 'Someone requested to reset your password. If this was you, please click the link.',
        headerIcon: '🔑',
        message:
            'Someone requested to reset your <strong>{appName}</strong> account password. If this was you, please click the button below to reset your password:',
        buttonText: 'Reset Password',
        reminderContent:
            '• This reset link will expire in <strong>1 hour</strong><br/>• If this was not you, please check your account security immediately<br/>• We recommend changing your password and enabling two-factor authentication',
        securityTip: 'If you did not request a password reset, please ignore this email and check your account security.',
    },

    loginOTP: {
        title: 'Your {appName} Login Verification Code',
        preheader: 'This is your one-time login verification code',
        headerIcon: '🔓',
        message:
            'You are attempting to log in to <strong>{appName}</strong>. Please use the verification code below to complete your login:',
        reminderContent:
            '• This verification code will expire in <strong>{expiresIn} minutes</strong><br/>• The verification code is valid only for this login<br/>• Do not share this code with others',
        securityTip: 'If this was not you, please ignore this email and check your account security.',
    },

    emailVerificationOTP: {
        title: 'Verify Your {appName} Email Address',
        preheader: 'Your email verification code has been sent',
        headerIcon: '📧',
        message:
            'You are verifying an email address to associate with your <strong>{appName}</strong> account. Please use the verification code below to complete the verification:',
        reminderContent:
            '• This verification code will expire in <strong>{expiresIn} minutes</strong><br/>• If you did not request email verification, please ignore this email<br/>• Do not share this code with others',
        securityTip: '{appName} will never proactively ask you for your verification code via email.',
    },

    passwordResetOTP: {
        title: 'Reset Your {appName} Password',
        preheader: 'Your password reset verification code has been sent',
        headerIcon: '🔐',
        message:
            'You are resetting your <strong>{appName}</strong> account password. Please use the verification code below to complete the reset:',
        reminderContent:
            '• This verification code will expire in <strong>{expiresIn} minutes</strong><br/>• If this was not you, please check your account security immediately<br/>• Do not share this code with others',
        securityTip: 'If you did not request a password reset, please ignore this email and check your account security.',
    },

    emailChangeVerification: {
        title: 'Confirm Your New Email Address',
        preheader: 'Confirm your new email address to complete the email change',
        headerIcon: '✉️',
        message:
            'You are changing your <strong>{appName}</strong> account email address to this email. Please click the button below to confirm:',
        buttonText: 'Confirm New Email',
        reminderContent:
            '• This confirmation link will expire in <strong>24 hours</strong><br/>• Your email will only be changed after you complete this confirmation<br/>• If you did not request to change your email, please ignore this email',
        securityTip:
            '{appName} will never ask you for your password or other sensitive information via email.',
    },

    magicLink: {
        title: 'Your {appName} Passwordless Login Link',
        preheader: 'Click the link to log in quickly',
        headerIcon: '🔗',
        message:
            'You requested a passwordless login. Please click the link below to log in to your <strong>{appName}</strong> account:',
        buttonText: 'Log In to My Account',
        reminderContent:
            '• This login link will expire in <strong>30 minutes</strong><br/>• This link is valid only for you<br/>• If you did not request to log in, please ignore this email',
        securityTip: 'If this was not you, please ignore this email and check your account security.',
    },

    securityNotification: {
        title: '{appName} Security Alert',
        preheader: 'A new login activity has been detected on your account',
        headerIcon: '🛡️',
        message:
            'We detected new login activity on your <strong>{appName}</strong> account:',
        reminderContent:
            '• If this was you, you can ignore this email<br/>• If you did not authorize this activity, please change your password immediately<br/>• To protect your account, we recommend enabling two-factor authentication',
        securityTip:
            'If you have any concerns about your account security, please contact us immediately: {contactEmail}',
    },

    subscriptionConfirmation: {
        title: 'Subscription Confirmed - {appName}',
        preheader: 'You have successfully subscribed to {appName}',
        headerIcon: '🔔',
        message:
            'Thank you for subscribing to <strong>{appName}</strong>! You have successfully subscribed to our email newsletter.',
        reminderContent:
            '• You will regularly receive our latest articles and updates<br/>• You can unsubscribe at any time using the "Unsubscribe" link at the bottom of our emails<br/>• If you wish to modify your subscription settings, please visit your account preferences',
        securityTip:
            'This email address is associated with your subscription. Please do not forward this email to others.',
    },

    weeklyNewsletter: {
        title: '{appName} Weekly - Top Articles This Week',
        preheader: 'Don\'t miss this week\'s highlights',
        headerIcon: '📰',
        message:
            'This is your weekly article digest from <strong>{appName}</strong>. Below are the top articles from this week:',
    },

    marketingCampaign: {
        title: '{title} - {appName}',
        preheader: '{summary}',
        headerIcon: '✨',
        greeting: 'Dear Subscriber,',
        buttonText: 'Read Full Article',
        author: 'Author: ',
        category: 'Category: ',
        publishedAt: 'Published: ',
    },

    adminAlert: {
        title: '{appName} Admin Notification',
        preheader: 'You have received a system admin alert from {appName}',
        headerIcon: '📢',
        NEW_USER: {
            subject: 'New User/Subscription Alert',
            message: 'A new user registration or email subscription was detected: <strong>{email}</strong>',
        },
        NEW_COMMENT: {
            subject: 'New Comment Pending Review',
            message: 'Post "{postTitle}" received a new comment from <strong>{author}</strong>:<br/><br/>{content}',
        },
    },

    commonParameters: {
        appName: 'Momei',
        baseUrl: '{baseUrl}',
        contactEmail: '{contactEmail}',
        currentYear: '{currentYear}',
        unsubscribeLink: 'Unsubscribe',
        viewInBrowser: 'View in Browser',
        allRightsReserved: 'All Rights Reserved',
    },
}
