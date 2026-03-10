import webpush from 'web-push'

const subjectArg = process.argv.find((argument) => argument.startsWith('--subject='))
const jsonOutput = process.argv.includes('--json')
const subject = subjectArg?.slice('--subject='.length) || process.env.WEB_PUSH_VAPID_SUBJECT || 'mailto:admin@example.com'

const { publicKey, privateKey } = webpush.generateVAPIDKeys()

const payload = {
    WEB_PUSH_VAPID_SUBJECT: subject,
    WEB_PUSH_VAPID_PUBLIC_KEY: publicKey,
    WEB_PUSH_VAPID_PRIVATE_KEY: privateKey,
}

if (jsonOutput) {
    console.log(JSON.stringify(payload, null, 2))
    process.exit(0)
}

console.log('# Add the following values to your environment variables')
console.log(`WEB_PUSH_VAPID_SUBJECT=${payload.WEB_PUSH_VAPID_SUBJECT}`)
console.log(`WEB_PUSH_VAPID_PUBLIC_KEY=${payload.WEB_PUSH_VAPID_PUBLIC_KEY}`)
console.log(`WEB_PUSH_VAPID_PRIVATE_KEY=${payload.WEB_PUSH_VAPID_PRIVATE_KEY}`)
console.log('')
console.log('# Optional flags')
console.log('#   --subject=mailto:you@example.com')
console.log('#   --json')
