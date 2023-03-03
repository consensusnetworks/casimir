import Session from 'supertokens-web-js/recipe/session'
import useEnvironment from '@/composables/environment'

const { usersBaseURL } = useEnvironment()

export const SuperTokensWebJSConfig = {
  appInfo: {
      apiDomain: usersBaseURL,
      appName: 'Casimir',
      // apiBasePath: '/',
  },
  recipeList: [Session.init()],
}
