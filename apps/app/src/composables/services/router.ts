import { createWebHistory, createRouter } from "vue-router"
import { ref } from "vue"
import { useDark, useToggle, useStorage } from "@vueuse/core"
import useEnvironment from "./environment"

// Welcome Flow
import WelcomeFlow from "@/pages/welcome/WelcomeFlow.vue"
import LoadingApp from "@/pages/welcome/views/LoadingApp.vue"
import Welcome from "@/pages/welcome/views/Welcome.vue"
import WelcomeBack from "@/pages/welcome/views/WelcomeBack.vue"

// 404
import PageNotFound from "@/pages/404/PageNotFound.vue"

const { usersUrl } = useEnvironment()
const skipWelcomePage = ref(false)
const skipWelcomePageStorage = useStorage("skipWelcomePage", skipWelcomePage)

const newlyLoadedApp = ref(true)
const newlyLoadedAppStorage = useStorage("newlyLoadedApp", newlyLoadedApp)


const routes = [
    { 
        path: "/onboarding", 
        name: WelcomeFlow,
        component: WelcomeFlow,
        children: [
            { 
                path: "loading-app", 
                name: LoadingApp,
                component: LoadingApp,
            },
            
            { 
                path: "welcome", 
                name: Welcome,
                component: Welcome,
            },
            { 
                path: "welcome-back", 
                name: WelcomeBack,
                component: WelcomeBack,
            },
        ]
    },
    { path: "/:pathMatch(.*)*", name: PageNotFound, component: PageNotFound },

    // { 
    // path: "/", 
    // name: Overview,
    // component: Overview,
    // },
    // { 
    // path: "/stake", 
    // name: Stake,
    // component: Stake,
    // },
    // { 
    // path: "/explore", 
    // name: Explore,
    // component: Explore,
    // },
    // { 
    // path: "/settings"
    // name: Settings,
    // component: Settings,
    // },
]


// TODO: 
// 1. take to /onbaording/loading-app
// 2. Check user session 
//      a. if user exists check for if user has skipWelcomePage on 
//          - if user does, take them to /overview
//          - if user does not, take them to /welcome-back
//      b. if user does not exist take them to /welcome

const router = createRouter({
    history: createWebHistory(),
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    routes
})


router.beforeEach(async (to, from, next) => {
    const isFirstLoad = newlyLoadedAppStorage.value
    if (isFirstLoad) {
        // Redirect to loading page on first load
        if (to.path !== "/onboarding/loading-app") {
            next("/onboarding/loading-app")
        } else {
            // Perform user session checks after redirecting to loading app
            newlyLoadedAppStorage.value = false
            const userExists = await checkUserSession()
            // TODO: get all user info if user exists
            const skipWelcome = skipWelcomePageStorage.value
            
            if (userExists) {
                if (skipWelcome) {
                    next("/") // Assuming '/' is the main app overview
                } else {
                    next("/onboarding/welcome-back")
                }
            } else {
                next("/onboarding/welcome")
            }
        }
    } else {
        next()
    }
})

async function checkUserSession(): Promise<boolean> {
    try {
        const { error, message } = await (await fetch(`${usersUrl}/user`)).json()
        if (message.includes("unauthorised")) {
            console.log("no session!")
            return false
        }
        return true
    } catch (err: any) {
        // TODO: Tell user to refresh and retry
        console.log("err in checkUserSessions :>> ", err)
        return false
    }
}
export default router