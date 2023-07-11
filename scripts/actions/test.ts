import { $, echo } from 'zx'
import { loadCredentials } from '@casimir/helpers'

/**
 * Test the GitHub Actions workflows in `.github/workflows`
 * 
 * Further information:
 * See https://github.com/nektos/act
 */
void async function () {

    /** Default to push workflow */
    const workflow = process.env.WORKFLOW || 'push'

    /** Get AWS credentials for deployment */
    const { accessKeyId, secretAccessKey } = await loadCredentials()

    /** Get Slack webhook URL for notifications */
    const slackWebhookURL = process.env.SLACK_WEBHOOK_URL

    /** Run action with nektos/act */
    echo(`🚀 Running ${workflow} workflow`)
    $`act ${workflow} \
    --rebuild \
    --secret AWS_ACCESS_KEY_ID=${accessKeyId} \
    --secret AWS_SECRET_ACCESS_KEY=${secretAccessKey} \
    --secret SLACK_WEBHOOK_URL=${slackWebhookURL}`
}()