import { ref, shallowRef } from "vue"
import { providers } from "ethers"
import { EthereumProvider } from "@walletconnect/ethereum-provider"
import { WalletConnectModal } from "@walletconnect/modal"
import { PairingTypes, SessionTypes } from "@walletconnect/types"
import useSiwe from "@/composables/siwe"
import useEthers from "@/composables/ethers"
import useEnvironment from "@/composables/environment"
import useUser from "@/composables/user"
import { CryptoAddress, LoginCredentials } from "@casimir/types"

const { createSiweMessage, signInWithEthereum } = useSiwe()
const { walletConnectProjectId } = useEnvironment()
const { getEthersBalance } = useEthers()
const { user } = useUser()

let cleanupFunctions: Array<any> = [] // TODO: Potentially fix type here.
const accounts = ref<Array<string>>([])
const ethereumProvider = ref()
const pairings = ref([])
const session = ref<SessionTypes.Struct>()
const web3Modal = ref()
const web3Provider = shallowRef()

const checkedForPersistedSession = ref(false)
const subscribedToProviderEvents = ref(false)

const componentIsMounted = ref(false)
const isInitializing = ref(false)

const walletConnectSelectedAccount = ref([] as Array<CryptoAddress>)

export default function useWalletConnect() {
    async function connectWalletConnect(chainId: "1" | "5" | "1337", pairing?: PairingTypes.Struct): Promise<CryptoAddress[]> {
        try {
            if (!ethereumProvider.value) throw new ReferenceError("WalletConnect Client is not initialized.")
        
            const customRpcs = {
                "1": `https://rpc.walletconnect.com?chainId=eip155:1&projectId=${walletConnectProjectId}`,
                "5": `https://rpc.walletconnect.com?chainId=eip155:5&projectId=${walletConnectProjectId}`,
                "1337": `https://rpc.walletconnect.com?chainId=eip155:1337&projectId=${walletConnectProjectId}`
            }
            const rpcUrl = customRpcs[chainId]
            if (!rpcUrl) throw new Error(`RPC URL not found for chainId: ${chainId}`)
            if (ethereumProvider.value.accounts.length > 0) throw new Error("Prompt user to simply change accounts to add it to their account")
            await ethereumProvider.value.connect()
            createEthersProvider()
            // const _accounts = await ethereumProvider.value.enable()
            const _accounts = ethereumProvider.value.accounts
            accounts.value = _accounts
            session.value = ethereumProvider.value.session
            web3Modal.value?.closeModal()
            walletConnectSelectedAccount.value = [{
                address: accounts.value[0],
                balance: (await getEthersBalance(accounts.value[0])).toString()
            }]
            
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

    function getWalletConnectSigner() {
        if (!web3Provider.value) throw new Error("Web3Provider is not initialized")
        return web3Provider.value.getSigner()
    }

    async function initializeWalletConnect() {
        if (componentIsMounted.value) return
        if (import.meta.env.MODE === "development") console.log("initializing wallet connect")
        componentIsMounted.value = true
        await createClient()
    }

    async function loginWithWalletConnect(loginCredentials: LoginCredentials) {
        const { provider, address, currency } = loginCredentials
        const message = await createSiweMessage(address, "Sign in with Ethereum to the Casimir.")
        const signedMessage = await signWalletConnectMessage(message)
        await signInWithEthereum({
            address,
            currency: currency || "ETH",
            provider,
            message,
            signedMessage
        })
    }
  
    async function signWalletConnectMessage(message: string) : Promise<string> {
        const signer = await web3Provider.value?.getSigner()
        return await signer?.signMessage(message) as string
    }

    async function _checkForPersistedSession() {
        if (ethereumProvider.value?.session) {
            session.value = ethereumProvider.value?.session
            console.log("RESTORED SESSION:", session.value)
            if (!user.value) {
                await disconnectWalletConnect()
            } else {
                if (!ethereumProvider.value) {
                    throw new ReferenceError("EthereumProvider is not initialized.")
                }
                walletConnectSelectedAccount.value = [{
                    address: ethereumProvider.value.accounts[0],
                    balance: (await getEthersBalance(ethereumProvider.value.accounts[0])).toString()
                }]
                createEthersProvider()
            }
        }
    }

    function _resetApp() {
        cleanupFunctions.forEach((cleanup) => cleanup())
        cleanupFunctions = [] // Reset the array
        pairings.value = []
        session.value = undefined
        accounts.value = []
        web3Provider.value = undefined
        walletConnectSelectedAccount.value = []
        checkedForPersistedSession.value = false
        subscribedToProviderEvents.value = false
    }

    function _subscribeToProviderEvents() {
        if (!ethereumProvider.value) {
            throw new Error("WalletConnect is not initialized")
        }

        // Event handler for display_uri
        const handleDisplayUri = (uri: string) => {
            console.log("QR Code Modal open")
            web3Modal.value?.openModal({ uri })
        }

        // Event handler for accountsChanged
        const handleAccountsChanged = async (walletConnectAccounts: Array<string>) => {
            console.log("ACCOUNTS CHANGED EVENT", walletConnectAccounts)
            if (!user.value && accounts.value.length > 0) return window.location.reload()
            
            // Check which accounts are new
            const userAccounts = user.value?.accounts.map((account) => account.address.toLowerCase().trim())
            const newAccounts = walletConnectAccounts.filter((account) => !userAccounts?.includes(account.toLowerCase().trim()))
            
            // Add new accounts to user
            if (newAccounts.length > 0) {
                // await addAccountToUser(newAccounts) // TODO: Enable this (review with @DemogorGod)
                const newAccountsWithBalances = await Promise.all(newAccounts.map(async (account) => {
                    return {
                        address: account,
                        balance: (await getEthersBalance(account)).toString()
                    }
                }))
                walletConnectSelectedAccount.value = [...walletConnectSelectedAccount.value, ...newAccountsWithBalances]
            }
        }

        // Event handler for chainChanged
        const handleChainChanged = (chainId: number) => {
            // console.log("CHAIN CHANGED EVENT", chainId)
        }

        // Event handler for session_ping
        const handleSessionPing = ({ id, topic }: { id: number; topic: string }) => {
            console.log("SESSION PING EVENT", "session_ping")
            console.log(id, topic)
        }

        // Event handler for session_event
        const handleSessionEvent = ({ event, chainId }: { event: any; chainId: string }) => {
            console.log("SESSION EVENT", event)
        }

        // Event handler for session_update
        const handleSessionUpdate = ({ topic, _session }: { topic: string; _session: SessionTypes.Struct }) => {
            console.log("SESSION UPDATE EVENT", "session_updated")
            session.value = _session
        }

        // Event handler for session_delete
        const handleSessionDelete = ({ id, topic }: { id: number; topic: string }) => {
            console.log("DELETE SESSION EVENT", "session_deleted", id, topic)
            _resetApp()
        }

        // Attaching the event listeners
        ethereumProvider.value.on("display_uri", handleDisplayUri)
        ethereumProvider.value.on("accountsChanged", handleAccountsChanged)
        ethereumProvider.value.on("chainChanged", handleChainChanged)
        ethereumProvider.value.on("session_ping", handleSessionPing)
        ethereumProvider.value.on("session_event", handleSessionEvent)
        ethereumProvider.value.on("session_update", handleSessionUpdate)
        ethereumProvider.value.on("session_delete", handleSessionDelete)

        // Storing cleanup functions
        cleanupFunctions.push(() => ethereumProvider.value.off("display_uri", handleDisplayUri))
        cleanupFunctions.push(() => ethereumProvider.value.off("accountsChanged", handleAccountsChanged))
        cleanupFunctions.push(() => ethereumProvider.value.off("chainChanged", handleChainChanged))
        cleanupFunctions.push(() => ethereumProvider.value.off("session_ping", handleSessionPing))
        cleanupFunctions.push(() => ethereumProvider.value.off("session_event", handleSessionEvent))
        cleanupFunctions.push(() => ethereumProvider.value.off("session_update", handleSessionUpdate))
        cleanupFunctions.push(() => ethereumProvider.value.off("session_delete", handleSessionDelete))
    }

    return {
        walletConnectSelectedAccount,
        web3Provider,
        connectWalletConnect,
        disconnectWalletConnect,
        getWalletConnectSigner,
        initializeWalletConnect,
        loginWithWalletConnect,
    }
}