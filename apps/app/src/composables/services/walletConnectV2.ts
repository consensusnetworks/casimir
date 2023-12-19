import { ref, shallowRef } from "vue"
import { providers } from "ethers"
import { EthereumProvider } from "@walletconnect/ethereum-provider"
import { WalletConnectModal } from "@walletconnect/modal"
import { PairingTypes, SessionTypes } from "@walletconnect/types"
import useSiwe from "@/composables/services/siwe"
import useEthers from "@/composables/services/ethers"
import useEnvironment from "@/composables/services/environment"
import useUser from "@/composables/services/user"
import { CryptoAddress, LoginCredentials } from "@casimir/types"

const { createSiweMessage, signInWithEthereum } = useSiwe()
const { walletConnectProjectId } = useEnvironment()
const { getEthersBalance } = useEthers()
const { user } = useUser()

let cleanupFunctions: Array<any> = [] // TODO: Potentially fix type here.
const accounts = ref<Array<string>>([])
const ethereumProvider = ref()
const pairings = ref([])
const session = ref()
const web3Modal = ref()
const web3Provider = shallowRef()

const checkedForPersistedSession = ref(false)
const subscribedToProviderEvents = ref(false)

const componentIsMounted = ref(false)
const isInitializing = ref(false)

export default function useWalletConnectV2() {
    async function connectWalletConnectV2(chainId: "1" | "5" | "1337", pairing?: PairingTypes.Struct): Promise<CryptoAddress[]> {
        try {
            if (!ethereumProvider.value) throw new ReferenceError("WalletConnect Client is not initialized.")
        
            const customRpcs = {
                "1": `https://rpc.walletconnect.com?chainId=eip155:1&projectId=${walletConnectProjectId}`,
                "5": `https://rpc.walletconnect.com?chainId=eip155:5&projectId=${walletConnectProjectId}`,
                "1337": `https://rpc.walletconnect.com?chainId=eip155:1337&projectId=${walletConnectProjectId}`
            }
            const rpcUrl = customRpcs[chainId]
            if (!rpcUrl) throw new Error(`RPC URL not found for chainId: ${chainId}`)

            await ethereumProvider.value.connect()
            createEthersProvider()
            const _accounts = await ethereumProvider.value.enable()
            accounts.value = _accounts
            session.value = session
            web3Modal.value?.closeModal()
            const connectedAddress = _accounts[0].toLowerCase().trim() as string
            const connectedAddressBalance = (await getEthersBalance(connectedAddress)).toString()
            return [{ address: connectedAddress as string, balance: connectedAddressBalance }]
        } catch (error) {
            console.error("Failed to connect:", error)
            throw error
        }
    }

    async function createClient() {
        try {
            isInitializing.value = true
            if (!walletConnectProjectId) return

            ethereumProvider.value = await EthereumProvider.init({
                projectId: walletConnectProjectId,
                chains: [5],
                showQrModal: true,
                methods: ["eth_sendTransaction",
                    "eth_signTransaction",
                    "eth_sign",
                    "personal_sign",
                    "eth_signTypedData"]
            })

            web3Modal.value = new WalletConnectModal({
                projectId: walletConnectProjectId,
            })

            if (!subscribedToProviderEvents.value) _subscribeToProviderEvents()
            if (!checkedForPersistedSession.value) await _checkForPersistedSession()
        } catch (err) {
            console.error(err)
        } finally {
            isInitializing.value = false
        }
    }

    function createEthersProvider() {
        const ethersProviderInstance = new providers.Web3Provider(ethereumProvider.value)
        web3Provider.value = ethersProviderInstance
    }

    async function disconnectWalletConnect() {
        if (!ethereumProvider.value) {
            throw new Error("ethereumProvider is not initialized")
        }
        await ethereumProvider.value.disconnect()
        _resetApp()
    }

    function getWalletConnectSignerV2() {
        if (!web3Provider.value) {
            throw new Error("Web3Provider is not initialized")
        }
        return web3Provider.value.getSigner()
    }

    async function initializeWalletConnect() {
        if (componentIsMounted.value) return
        if (import.meta.env.MODE === "development") console.log("initializing wallet connect")
        componentIsMounted.value = true

        // Check for persisted sessions & Subscribe to provider events
        if (ethereumProvider.value && user.value) {
            _subscribeToProviderEvents()
            subscribedToProviderEvents.value = true
            await _checkForPersistedSession()
            checkedForPersistedSession.value = true
        } else {
            await createClient()
        }
    }

    async function loginWithWalletConnectV2(loginCredentials: LoginCredentials) {
        const { provider, address, currency } = loginCredentials
        try {
            const message = await createSiweMessage(address, "Sign in with Ethereum to the Casimir.")
            const signedMessage = await signWalletConnectMessage(message)
            await signInWithEthereum({
                address,
                currency: currency || "ETH",
                provider,
                message,
                signedMessage
            })
        } catch (err) {
            console.log("error in loginWithWalletConnect :>> ", err)
        }
    }
  
    async function signWalletConnectMessage(message: string) : Promise<string> {
        try {
            const signer = await web3Provider.value?.getSigner()
            return await signer?.signMessage(message) as string
        } catch (err) {
            console.error("error in signWalletConnectMessage :>> ", err)
            throw err
            return ""
        }
    }

    function uninitializeWalletConnect() {
        cleanupFunctions.forEach((cleanup) => cleanup())
        cleanupFunctions = [] // Reset the array
        componentIsMounted.value = false
    }

    async function _checkForPersistedSession() {
        if (ethereumProvider.value?.session) {
            const _session = ethereumProvider.value?.session
            console.log("RESTORED SESSION:", _session)
            if (!user.value) {
                await disconnectWalletConnect()
                return
            }
            await _onSessionConnected(_session)
            return _session
        }
    }

    async function _onSessionConnected(_session: SessionTypes.Struct) {
        if (!ethereumProvider.value) {
            throw new ReferenceError("EthereumProvider is not initialized.")
        }
        const allNamespaceAccounts = Object.values(_session.namespaces).map(namespace => namespace.accounts).flat()
        const allNamespaceChains = Object.keys(_session.namespaces)

        session.value = _session
        accounts.value = allNamespaceAccounts.map(account => account.split(":")[2])
        console.log("RESTORED", allNamespaceChains, allNamespaceAccounts)
        createEthersProvider()
    }

    function _resetApp() {
        console.log("resetting app")
        pairings.value = []
        session.value = undefined
        accounts.value = []
    }

    function _subscribeToProviderEvents() {
        if (!ethereumProvider.value) {
            throw new Error("WalletConnect is not initialized")
        }

        // Event handler for display_uri
        const handleDisplayUri = (uri: string) => {
            console.log("DISPLAY URI EVENT", "QR Code Modal open")
            web3Modal.value?.openModal({ uri })
        }

        // Event handler for session_ping
        const handleSessionPing = ({ id, topic }: { id: number; topic: string }) => {
            console.log("SESSION PING EVENT", "session_ping")
            console.log(id, topic)
        }

        // Event handler for session_event
        const handleSessionEvent = ({ event, chainId }: { event: any; chainId: string }) => {
            console.log("SESSION EVENT", "session_event")
            console.log(event, chainId)
        }

        // Event handler for session_update
        const handleSessionUpdate = ({ topic, _session }: { topic: string; _session: SessionTypes.Struct }) => {
            console.log("SESSION UPDATE EVENT", "session_updated")
            session.value = _session
        }

        // Event handler for session_delete
        const handleSessionDelete = ({ id, topic }: { id: number; topic: string }) => {
            console.log("DELETE SESSION EVENT", "session_deleted")
            console.log(id, topic)
            _resetApp()
        }

        // Attaching the event listeners
        ethereumProvider.value.on("display_uri", handleDisplayUri)
        ethereumProvider.value.on("session_ping", handleSessionPing)
        ethereumProvider.value.on("session_event", handleSessionEvent)
        ethereumProvider.value.on("session_update", handleSessionUpdate)
        ethereumProvider.value.on("session_delete", handleSessionDelete)

        // Storing cleanup functions
        cleanupFunctions.push(() => ethereumProvider.value.off("display_uri", handleDisplayUri))
        cleanupFunctions.push(() => ethereumProvider.value.off("session_ping", handleSessionPing))
        cleanupFunctions.push(() => ethereumProvider.value.off("session_event", handleSessionEvent))
        cleanupFunctions.push(() => ethereumProvider.value.off("session_update", handleSessionUpdate))
        cleanupFunctions.push(() => ethereumProvider.value.off("session_delete", handleSessionDelete))
    }

    return {
        web3Provider,
        connectWalletConnectV2,
        disconnectWalletConnect,
        getWalletConnectSignerV2,
        initializeWalletConnect,
        loginWithWalletConnectV2,
        uninitializeWalletConnect
    }
}