import { ref } from 'vue'
import { providers } from 'ethers'
import { EthereumProvider } from '@walletconnect/ethereum-provider'
import { WalletConnectModal } from '@walletconnect/modal'
import { PairingTypes, SessionTypes } from '@walletconnect/types'
import useAuth from '@/composables/auth'
// import useEthers from '@/composables/ethers'
import { LoginCredentials } from '@casimir/types'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore

const DEFAULT_PROJECT_ID = '8e6877b49198d7a9f9561b8712805726'
const DEFAULT_RELAY_URL = 'wss://relay.walletconnect.com'
const DEFAULT_LOGGER = 'warn'

const { createSiweMessage, signInWithEthereum } = useAuth()
// const { getEthersBalance } = useEthers()
let cleanupFunctions: Array<any> = [] // TODO: Potentially fix type here.
const accounts = ref([])
const ethereumProvider = ref()
const pairings = ref([])
const session = ref()
const web3Modal = ref()
const web3Provider = ref()

const componentIsMounted = ref(false)
const isInitializing = ref(false)

export default function useWalletConnectV2() {
  async function connect(chainId: '1' | '5' | '1337', pairing?: PairingTypes.Struct) {
    try {
        if (!ethereumProvider.value) {
            throw new ReferenceError('WalletConnect Client is not initialized.')
        }

        console.log('Enabling EthereumProvider for chainId: ', chainId)

        const customRpcs = {
            '1': `https://rpc.walletconnect.com?chainId=eip155:1&projectId=${DEFAULT_PROJECT_ID}`,
            '5': `https://rpc.walletconnect.com?chainId=eip155:5&projectId=${DEFAULT_PROJECT_ID}`,
            '1337': `https://rpc.walletconnect.com?chainId=eip155:1337&projectId=${DEFAULT_PROJECT_ID}`
        }

        const rpcUrl = customRpcs[chainId]
        console.log('rpcUrl :>> ', rpcUrl)

        if (!rpcUrl) {
            throw new Error(`RPC URL not found for chainId: ${chainId}`)
        }
        console.log('ethereumProvider.value :>> ', ethereumProvider.value)
        const newSession = await ethereumProvider.value.connect()
        // const newSession = await ethereumProvider.value.enable()

        console.log('newSession :>> ', newSession)
        createEthersProvider()
        console.log('ethereumProvider.value :>> ', ethereumProvider.value)
        const _accounts = await ethereumProvider.value.enable()
        console.log('_accounts', _accounts)
        accounts.value = _accounts
        session.value = session

        web3Modal.value?.closeModal()
    } catch (error) {
        console.error('Failed to connect:', error)
    }
  }

  async function createClient() {
    try {
      isInitializing.value = true
      if (!DEFAULT_PROJECT_ID) return

      ethereumProvider.value = await EthereumProvider.init({
        projectId: DEFAULT_PROJECT_ID,
        chains: [5],
        showQrModal: true,
        methods: ['eth_sendTransaction', 'eth_signTransaction', 'eth_sign', 'personal_sign', 'eth_signTypedData']
      })

      // web3Modal.value = new WalletConnectModal({
      //   projectId: DEFAULT_PROJECT_ID,
      // })
      // console.log('ethereumProvider.value :>> ', ethereumProvider.value)

      // _subscribeToProviderEvents()
      // await _checkForPersistedSession()
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

  async function disconnect() {
    if (!ethereumProvider.value) {
        throw new Error('ethereumProvider is not initialized')
    }
    await ethereumProvider.value.disconnect()
    _resetApp()
  }

  // async function getWalletConnectSignerV2(): Promise<ethers.Signer | null> {
  //   await reinitializeWalletConnect()
  //   // Create a new instance of the Web3Provider based on the current provider's connection
  //   const newWeb3Provider = new providers.Web3Provider(nonReactiveWalletConnectWeb3Provider?.provider as providers.ExternalProvider)
  //   return newWeb3Provider.getSigner() || null
  // }

  async function loginWithWalletConnectV2(loginCredentials: LoginCredentials) {
    const { provider, address, currency } = loginCredentials
    try {
      const message = await createSiweMessage(address, 'Sign in with Ethereum to the Casimir.')
      const signedMessage = await signWalletConnectMessage(message)
      await signInWithEthereum({
        address,
        currency: currency || 'ETH',
        provider,
        message,
        signedMessage
      })
    } catch (err) {
      console.log('error in loginWithWalletConnect :>> ', err)
    }
  }

  async function initializeWalletConnect() {
    if (componentIsMounted.value) return
    componentIsMounted.value = true

    // Create the WalletConnect client
    if (!ethereumProvider.value) await createClient()

    // Check for persisted sessions
    if (ethereumProvider.value) await _checkForPersistedSession()
  
    // Subscribe to provider events
    if (ethereumProvider.value) {
      console.log('subscribing started')
      _subscribeToProviderEvents()
    }
  }
  
  // async function signWalletConnectMessage(message: string) : Promise<string>{
  //   try {
  //     console.log('got to signWalletConnectMessage')
  //     console.log('message :>> ', message)
  //     const signer = nonReactiveWalletConnectWeb3Provider?.getSigner()
  //     console.log('signer :>> ', signer)
  //     return await signer?.signMessage(message) as string
  //   } catch(err) {
  //     console.error('error in signWalletConnectMessage :>> ', err)
  //     throw err
  //     return ''
  //   }
  // }

  function uninitializeWalletConnect() {
    cleanupFunctions.forEach((cleanup) => cleanup())
    cleanupFunctions = [] // Reset the array
    componentIsMounted.value = false
  }

  async function _checkForPersistedSession() {
    console.log('ethereumProvider.value :>> ', ethereumProvider.value)
    if (ethereumProvider.value?.session) {
        const _session = ethereumProvider.value?.session
        console.log('RESTORED SESSION:', _session)
        await _onSessionConnected(_session)
        return _session
    }
  }

  async function _onSessionConnected(_session: SessionTypes.Struct) {
    if (!ethereumProvider.value) {
        throw new ReferenceError('EthereumProvider is not initialized.')
    }
    const allNamespaceAccounts = Object.values(_session.namespaces).map(namespace => namespace.accounts).flat()
    const allNamespaceChains = Object.keys(_session.namespaces)

    const chainData = allNamespaceAccounts[0].split(':')
    console.log('chainData :>> ', chainData)

    session.value = _session
    accounts.value = allNamespaceAccounts.map(account => account.split(':')[2])
    console.log('RESTORED', allNamespaceChains, allNamespaceAccounts)
    createEthersProvider()
  }

  function _resetApp() {
    console.log('resetting app')
    pairings.value = []
    session.value = undefined
    accounts.value = []
  }

  function _subscribeToProviderEvents() {
    if (!ethereumProvider.value) {
        throw new Error('WalletConnect is not initialized')
    }

    // Event handler for display_uri
    const handleDisplayUri = (uri: string) => {
      console.log('DISPLAY URI EVENT', 'QR Code Modal open')
      web3Modal.value?.openModal({ uri })
    }

    // Event handler for session_ping
    const handleSessionPing = ({ id, topic }: { id: number; topic: string }) => {
      console.log('SESSION PING EVENT', 'session_ping')
      console.log(id, topic)
    }

    // Event handler for session_event
    const handleSessionEvent = ({ event, chainId }: { event: any; chainId: string }) => {
      console.log('SESSION EVENT', 'session_event')
      console.log(event, chainId)
    }

    // Event handler for session_update
    const handleSessionUpdate = ({ topic, _session }: { topic: string; _session: SessionTypes.Struct }) => {
      console.log('SESSION UPDATE EVENT', 'session_updated')
      session.value = _session
    }

    // Event handler for session_delete
    const handleSessionDelete = ({ id, topic }: { id: number; topic: string }) => {
      console.log('DELETE SESSION EVENT', 'session_deleted')
      console.log(id, topic)
      _resetApp()
    }

    // Attaching the event listeners
    ethereumProvider.value.on('display_uri', handleDisplayUri)
    ethereumProvider.value.on('session_ping', handleSessionPing)
    ethereumProvider.value.on('session_event', handleSessionEvent)
    ethereumProvider.value.on('session_update', handleSessionUpdate)
    ethereumProvider.value.on('session_delete', handleSessionDelete)

    // Storing cleanup functions
    cleanupFunctions.push(() => ethereumProvider.value.off('display_uri', handleDisplayUri))
    cleanupFunctions.push(() => ethereumProvider.value.off('session_ping', handleSessionPing))
    cleanupFunctions.push(() => ethereumProvider.value.off('session_event', handleSessionEvent))
    cleanupFunctions.push(() => ethereumProvider.value.off('session_update', handleSessionUpdate))
    cleanupFunctions.push(() => ethereumProvider.value.off('session_delete', handleSessionDelete))
  }

  return {
    initializeWalletConnect,
    loginWithWalletConnectV2,
    uninitializeWalletConnect
  }
}