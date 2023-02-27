import Session from 'supertokens-web-js/recipe/session'
import useEnvironment from '@/composables/environment'

const { usersBaseURL } = useEnvironment()

export const SuperTokensWebJSConfig = {
  appInfo: {
      apiDomain: 'http://localhost:4000', // Replace with usersBaseURL
      appName: 'Casimir',
      // apiBasePath: '/',
  },
  recipeList: [Session.init()],
}
