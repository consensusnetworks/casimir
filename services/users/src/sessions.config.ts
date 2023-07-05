import Session from 'supertokens-node/recipe/session'
import { TypeInput } from 'supertokens-node/types'

export const SuperTokensBackendConfig: TypeInput = {
    framework: 'express',
    supertokens: {
        // SuperTokens core (temporary) host
        connectionURI: process.env.SESSIONS_HOST || 'https://try.supertokens.com',
        apiKey: process.env.SESSIONS_KEY || ''
    },
    appInfo: {
        appName: process.env.PROJECT || 'casimir',
        apiDomain: process.env.USERS_URL || 'http://localhost:4000',
        websiteDomain: process.env.WEB_URL || 'http://localhost:3001'
    },
    recipeList: [
        Session.init(),
    ]
}
