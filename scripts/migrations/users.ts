import { getSecret } from '@casimir/helpers'

void async function () {
    const project = process.env.PROJECT || 'casimir'
    const stage = process.env.STAGE || 'dev'
    const service = 'users'
    const dbCredentials = await getSecret(`${project}-${stage}-${service}-db-credentials`)
    console.log(dbCredentials)
}()