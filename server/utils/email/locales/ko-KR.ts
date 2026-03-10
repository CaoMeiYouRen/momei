/**
 * 韩文邮件国际化配置
 */
export const emailLocalesKoKR = {
    verification: {
        title: '{appName} 이메일 주소를 인증해 주세요',
        preheader: '{appName}에 오신 것을 환영합니다! 가입을 완료하려면 이메일 주소를 인증해 주세요.',
        headerIcon: '🔐',
        message:
            '<strong>{appName}</strong>에 가입해 주셔서 감사합니다! 계정 보안을 위해 아래 버튼을 눌러 이메일 주소를 인증해 주세요.',
        buttonText: '이메일 주소 인증',
        reminderContent:
            '• 이 인증 링크는 <strong>24시간</strong> 후 만료됩니다<br/>• {appName} 계정을 등록한 적이 없다면 이 메일을 무시해 주세요<br/>• 계정 보호를 위해 이 링크를 다른 사람과 공유하지 마세요',
        securityTip: '{appName}은 이메일로 비밀번호, 인증 코드 또는 기타 민감한 정보를 요구하지 않습니다.',
    },

    passwordReset: {
        title: '{appName} 비밀번호 재설정',
        preheader: '누군가 비밀번호 재설정을 요청했습니다. 본인이 맞다면 링크를 클릭해 주세요.',
        headerIcon: '🔑',
        message:
            '누군가 <strong>{appName}</strong> 계정의 비밀번호 재설정을 요청했습니다. 본인이 맞다면 아래 버튼을 눌러 비밀번호를 재설정해 주세요:',
        buttonText: '비밀번호 재설정',
        reminderContent:
            '• 이 재설정 링크는 <strong>1시간</strong> 후 만료됩니다<br/>• 본인이 아니라면 즉시 계정 보안을 확인해 주세요<br/>• 비밀번호를 변경하고 2단계 인증을 활성화하는 것을 권장합니다',
        securityTip: '비밀번호 재설정을 요청한 적이 없다면 이 메일을 무시하고 계정 보안을 확인해 주세요.',
    },

    loginOTP: {
        title: '{appName} 로그인 인증 코드',
        preheader: '일회용 로그인 인증 코드입니다',
        headerIcon: '🔓',
        message: '<strong>{appName}</strong>에 로그인하려고 합니다. 아래 인증 코드를 입력해 로그인을 완료해 주세요:',
        reminderContent:
            '• 이 인증 코드는 <strong>{expiresIn}분</strong> 후 만료됩니다<br/>• 인증 코드는 이번 로그인에만 유효합니다<br/>• 인증 코드를 다른 사람과 공유하지 마세요',
        securityTip: '본인이 아니라면 이 메일을 무시하고 계정 보안을 확인해 주세요.',
    },

    emailVerificationOTP: {
        title: '{appName} 이메일 주소 인증',
        preheader: '이메일 인증 코드가 발송되었습니다',
        headerIcon: '📧',
        message:
            '<strong>{appName}</strong> 계정에 연결할 이메일 주소를 인증하고 있습니다. 아래 인증 코드를 입력해 인증을 완료해 주세요:',
        reminderContent:
            '• 이 인증 코드는 <strong>{expiresIn}분</strong> 후 만료됩니다<br/>• 이메일 인증을 요청한 적이 없다면 이 메일을 무시해 주세요<br/>• 인증 코드를 다른 사람과 공유하지 마세요',
        securityTip: '{appName}은 이메일로 인증 코드를 먼저 요구하지 않습니다.',
    },

    passwordResetOTP: {
        title: '{appName} 비밀번호 재설정',
        preheader: '비밀번호 재설정 인증 코드가 발송되었습니다',
        headerIcon: '🔐',
        message:
            '<strong>{appName}</strong> 계정의 비밀번호를 재설정하고 있습니다. 아래 인증 코드를 입력해 재설정을 완료해 주세요:',
        reminderContent:
            '• 이 인증 코드는 <strong>{expiresIn}분</strong> 후 만료됩니다<br/>• 본인이 아니라면 즉시 계정 보안을 확인해 주세요<br/>• 인증 코드를 다른 사람과 공유하지 마세요',
        securityTip: '비밀번호 재설정을 요청한 적이 없다면 이 메일을 무시하고 계정 보안을 확인해 주세요.',
    },

    emailChangeVerification: {
        title: '새 이메일 주소를 확인해 주세요',
        preheader: '이메일 변경을 완료하려면 새 이메일 주소를 확인해 주세요',
        headerIcon: '✉️',
        message:
            '<strong>{appName}</strong> 계정의 이메일 주소를 이 주소로 변경하려고 합니다. 아래 버튼을 눌러 확인해 주세요:',
        buttonText: '새 이메일 확인',
        reminderContent:
            '• 이 확인 링크는 <strong>24시간</strong> 후 만료됩니다<br/>• 확인을 완료해야 이메일 주소 변경이 적용됩니다<br/>• 이메일 변경을 요청한 적이 없다면 이 메일을 무시해 주세요',
        securityTip: '{appName}은 이메일로 비밀번호나 기타 민감한 정보를 요구하지 않습니다.',
    },

    magicLink: {
        title: '{appName} 비밀번호 없는 로그인 링크',
        preheader: '링크를 클릭해 빠르게 로그인하세요',
        headerIcon: '🔗',
        message:
            '비밀번호 없는 로그인을 요청했습니다. 아래 링크를 눌러 <strong>{appName}</strong> 계정에 로그인해 주세요:',
        buttonText: '내 계정 로그인',
        reminderContent:
            '• 이 로그인 링크는 <strong>30분</strong> 후 만료됩니다<br/>• 이 링크는 본인에게만 유효합니다<br/>• 로그인 요청을 하지 않았다면 이 메일을 무시해 주세요',
        securityTip: '본인이 아니라면 이 메일을 무시하고 계정 보안을 확인해 주세요.',
    },

    securityNotification: {
        title: '{appName} 보안 알림',
        preheader: '계정에서 새로운 로그인 활동이 감지되었습니다',
        headerIcon: '🛡️',
        message: '<strong>{appName}</strong> 계정에서 새로운 로그인 활동이 감지되었습니다:',
        reminderContent:
            '• 본인의 활동이라면 이 메일을 무시하셔도 됩니다<br/>• 승인하지 않은 활동이라면 즉시 비밀번호를 변경해 주세요<br/>• 계정 보호를 위해 2단계 인증 활성화를 권장합니다',
        securityTip: '계정 보안과 관련해 우려가 있다면 즉시 연락해 주세요: {contactEmail}',
    },

    subscriptionConfirmation: {
        title: '구독 확인 - {appName}',
        preheader: '{appName} 구독이 완료되었습니다',
        headerIcon: '🔔',
        message: '<strong>{appName}</strong>을 구독해 주셔서 감사합니다! 뉴스레터 구독이 정상적으로 완료되었습니다.',
        reminderContent:
            '• 최신 글과 업데이트를 정기적으로 받아보게 됩니다<br/>• 메일 하단의 "구독 취소" 링크를 통해 언제든지 구독을 해지할 수 있습니다<br/>• 구독 설정을 변경하려면 계정 환경설정을 방문해 주세요',
        securityTip: '이 이메일 주소는 현재 구독과 연결되어 있습니다. 다른 사람에게 이 메일을 전달하지 마세요.',
    },

    weeklyNewsletter: {
        title: '{appName} 주간 뉴스레터 - 이번 주 주요 글',
        preheader: '이번 주의 하이라이트를 놓치지 마세요',
        headerIcon: '📰',
        message: '이번 주 <strong>{appName}</strong>의 글 요약입니다. 아래에서 주요 글을 확인해 보세요:',
    },

    marketingCampaign: {
        title: '{title} - {appName}',
        preheader: '{summary}',
        headerIcon: '✨',
        greeting: '구독자님께,',
        buttonText: '전체 글 읽기',
        author: '작성자: ',
        category: '카테고리: ',
        publishedAt: '게시일: ',
    },

    adminAlert: {
        title: '{appName} 운영 알림',
        preheader: '{appName}에서 시스템 운영 알림이 도착했습니다',
        headerIcon: '📢',
        NEW_USER: {
            subject: '새 사용자 / 구독 알림',
            message: '새 사용자 가입 또는 이메일 구독이 감지되었습니다: <strong>{email}</strong>',
        },
        NEW_COMMENT: {
            subject: '검토 대기 중인 새 댓글',
            message: '게시글 "{postTitle}"에 <strong>{author}</strong>님의 새 댓글이 등록되었습니다:<br/><br/>{content}',
        },
    },

    commonParameters: {
        appName: 'Momei',
        baseUrl: '{baseUrl}',
        contactEmail: '{contactEmail}',
        currentYear: '{currentYear}',
        unsubscribeLink: '구독 취소',
        viewInBrowser: '브라우저에서 보기',
        allRightsReserved: '판권 소유',
    },
}
