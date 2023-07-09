import Session from 'supertokens-web-js/recipe/session'
import useEnvironment from '@/composables/environment'

const { usersUrl } = useEnvironment()

export const SuperTokensWebJSConfig = {
  appInfo: {
      apiDomain: usersUrl,
      appName: 'Casimir',
      // apiBasePath: '/',
  },
  recipeList: [Session.init()],
}