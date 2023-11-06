import { loadCredentials } from "@casimir/aws"
import { run } from "@casimir/shell"

/**
 * Test a workflow from `.github/workflows`
 */
void async function () {

    const workflow = process.env.WORKFLOW || "push"

    const { accessKeyId, secretAccessKey } = await loadCredentials()

    const slackWebhookURL = process.env.SLACK_WEBHOOK_URL

    console.log(`🚀 Running ${workflow} workflow`)
    await run(`act ${workflow} --rebuild --secret AWS_ACCESS_KEY_ID=${accessKeyId} --secret AWS_SECRET_ACCESS_KEY=${secretAccessKey} --secret SLACK_WEBHOOK_URL=${slackWebhookURL}`)
}()