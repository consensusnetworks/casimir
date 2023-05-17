import Session from 'supertokens-node/recipe/session'
import { TypeInput } from 'supertokens-node/types'

export const SuperTokensBackendConfig: TypeInput = {
    framework: 'express',
    supertokens: {
        // SuperTokens core (temporary) host
        connectionURI: 'https://try.supertokens.com',
    },
    appInfo: {
        appName: 'Casimir',
        apiDomain: 'http://localhost:4000',
        websiteDomain: 'http://localhost:3001',
    },
    recipeList: [
        Session.init(),
    ],
}
