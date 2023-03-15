import { $, argv, echo } from 'zx'
import { loadCredentials } from '@casimir/helpers'

/**
 * Test the GitHub Actions workflows in `.github/workflows`
 * 
 * Arguments:
 *      --workflow: workflow-to-test (optional, i.e., --workflow release)
 * 
 * Further information:
 * See https://github.com/nektos/act
 */
void async function () {
    /** Workflows available to test */
    const workflows = ['push', 'release']

    /** Default to push workflow */
    const workflow = workflows.includes(argv.workflow) ? argv.workflow : 'push'

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