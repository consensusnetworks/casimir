import { ref, onMounted, onBeforeUnmount } from 'vue'
import Client from '@walletconnect/sign-client'
import { ethers, providers } from 'ethers'
import { apiGetChainNamespace, ChainsMap } from 'caip-api'
import { PairingTypes, SessionTypes } from '@walletconnect/types'
import { CryptoAddress, LoginCredentials } from '@casimir/types'
import { Web3Modal } from '@web3modal/standalone'
import { Web3Provider } from '@ethersproject/providers'
import UniversalProvider from '@walletconnect/universal-provider'
import useAuth from '@/composables/auth'

const { createSiweMessage, signInWithEthereum } = useAuth()
const balances = ref<AccountBalances | null>(null)
const chain = ref<string>('')
const chainData = ref<ChainNamespaces | null>(null)
const client = ref<Client | null>(null)
let cleanupFunctions: Array<any> = [] // TODO: Potentially fix type here.
const ethereumProvider = ref<UniversalProvider | null>(null)
const hasCheckedPersistedSession = ref(false)
const isInitializing = ref(false)
const pairings = ref<PairingTypes.Struct[]>([])
const session = ref<SessionTypes.Struct | null>(null)
const walletConnectWeb3Provider = ref<Web3Provider | null>(null)
const walletConnectAddresses = ref<CryptoAddress[]>([])
const web3Modal = ref<Web3Modal | null>(null)


interface AccountBalances {
  [account: string]: AssetData;
}

interface AssetData {
  account: string;
  symbol: string;
  balance: string;
  contractAddress?: string;
}

interface ChainNamespaces {
  [namespace: string]: ChainsMap;
}

export default function useWalletConnectV2() {
  async function connectWalletConnectV2(caipChainId: string, pairing?: { topic: string }) {
    if (!ethereumProvider.value) {
      throw new ReferenceError('WalletConnect Client is not initialized.')
    }
  
    const chainId = caipChainId.split(':').pop()
  
    try {
        const _session = await ethereumProvider.value.connect({
          namespaces: {
            eip155: {
              methods: [
                'eth_sendTransaction',
                'eth_signTransaction',
                'eth_sign',
                'personal_sign',
                'eth_signTypedData',
              ],
              chains: [`eip155:${chainId}`],
              events: ['chainChanged', 'accountsChanged'],
              rpcMap: { chainId: `https://rpc.walletconnect.com?chainId=eip155:${chainId}&projectId=${DEFAULT_PROJECT_ID}`,},
            },
          },
          pairingTopic: pairing?.topic,
        })
      
        createWeb3Provider(ethereumProvider.value as UniversalProvider)
        const _accounts = await ethereumProvider.value.enable()
        console.log('_accounts', _accounts)
        walletConnectAddresses.value = _accounts.map(address => {
          // TODO: Replace balance placeholder with actual balance in BOTH PLACES.
          return {
            address,
            balance: '40'
          }
        })
        if (!_session) {
          console.error('Failed to establish a session.')
          return  // or throw an error if that's more appropriate
        }
        session.value = _session
        chain.value = caipChainId
      
        web3Modal.value?.closeModal()
    } catch (e) {
      console.error('Failed to connect to WalletConnect.')
      console.error(e)
    }
  }

  function getEthersWalletConnectSignerV2(): ethers.Signer | null {
    return walletConnectWeb3Provider.value?.getSigner() || null
  }

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

  onBeforeUnmount(() => {
    cleanupFunctions.forEach((cleanup) => cleanup())
    cleanupFunctions = [] // Reset the array
  })

  onMounted(async () => {
    // Load chain data
    await loadChainData()
  
    // Create the WalletConnect client
    if (!client.value) {
      await createClient()
    }
  
    // Check for persisted sessions
    if (ethereumProvider.value && !hasCheckedPersistedSession.value) {
      await _checkForPersistedSession()
      hasCheckedPersistedSession.value = true
    }
  
    // Subscribe to provider events
    if (ethereumProvider.value) {
      console.log('subscribing started')
      _subscribeToProviderEvents()
    }
  })

  async function signWalletConnectMessage(message: string) : Promise<string>{
    try {
      const signer = walletConnectWeb3Provider.value?.getSigner()
      return await signer?.signMessage(message) as string
    } catch(err) {
      console.error('error in signWalletConnectMessage :>> ', err)
      throw err
      return ''
    }
  }

  return {
    walletConnectAddresses,
    walletConnectWeb3Provider,
    connectWalletConnectV2,
    getEthersWalletConnectSignerV2,
    loginWithWalletConnectV2
  }
}

async function _checkForPersistedSession() {
  const provider = ethereumProvider.value as UniversalProvider
  if (!provider) {
    throw new Error('WalletConnect is not initialized')
  }
  const localPairings = provider.client.pairing.getAll({ active: true })
  pairings.value = localPairings
  console.log('RESTORED PAIRINGS: ', localPairings)

  if (typeof session.value !== 'undefined') return

  if (provider.session) {
    const _session = provider.session
    console.log('RESTORED SESSION:', _session)
    await onSessionConnected(_session)
    return _session
  }
}

async function createClient() {
  isInitializing.value = true

  if (!DEFAULT_PROJECT_ID) {
      console.log('There is no project ID set for WalletConnect')
      return
  }

  ethereumProvider.value = await UniversalProvider.init({
      projectId: DEFAULT_PROJECT_ID,
      logger: DEFAULT_LOGGER,
      relayUrl: DEFAULT_RELAY_URL,
  })

  const localWeb3Modal = new Web3Modal({
      projectId: DEFAULT_PROJECT_ID,
      walletConnectVersion: 2,
  })

  client.value = ethereumProvider.value.client
  web3Modal.value = localWeb3Modal
}

function createWeb3Provider(provider: UniversalProvider) {
  walletConnectWeb3Provider.value = new providers.Web3Provider(provider)
}

async function loadChainData() {
  const namespaces = getAllChainNamespaces()
  const localChainData: ChainNamespaces = {}
  await Promise.all(
    namespaces.map(async (namespace: any) => {
      let chains: ChainsMap | undefined
      try {
        chains = await apiGetChainNamespace(namespace)
        console.log('chains :>> ', chains)
      } catch (e) {
        // ignore error
      }
      if (typeof chains !== 'undefined') {
        localChainData[namespace] = chains
      }
    }),
  )
  chainData.value = localChainData
}

function getAllChainNamespaces() {
  const namespaces: string[] = []
  DEFAULT_CHAINS.forEach(chainId => {
    const [namespace] = chainId.split(':')
    if (!namespaces.includes(namespace)) {
      namespaces.push(namespace)
    }
  })
  return namespaces
}

async function onSessionConnected(_session: SessionTypes.Struct) {
  if (!ethereumProvider.value) {
    throw new ReferenceError('EthereumProvider is not initialized.')
  }

  const allNamespaceAccounts = Object.values(_session.namespaces)
    .map(namespace => namespace.accounts)
    .flat()
  const allNamespaceChains = Object.keys(_session.namespaces)

  const chainData = allNamespaceAccounts[0].split(':')
  const caipChainId = `${chainData[0]}:${chainData[1]}`
  chain.value = caipChainId
  session.value = _session
  // TODO: Replace balance placeholder with actual balance in BOTH PLACES.
  walletConnectAddresses.value = allNamespaceAccounts.map(account => {
    return {
      address: account.split(':')[2],
      balance: '40'
    }
  })
  createWeb3Provider(ethereumProvider.value as UniversalProvider)
}

function resetApp() {
  pairings.value = []
  session.value = null
  balances.value = {}
  walletConnectAddresses.value = []
  chain.value = ''
  walletConnectWeb3Provider.value = null
}

function _subscribeToProviderEvents() {
  const provider = ethereumProvider.value as UniversalProvider
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
    resetApp()
  }

  // Attaching the event listeners
  provider.on('display_uri', handleDisplayUri)
  provider.on('session_ping', handleSessionPing)
  provider.on('session_event', handleSessionEvent)
  provider.on('session_update', handleSessionUpdate)
  provider.on('session_delete', handleSessionDelete)

  // Storing cleanup functions
  cleanupFunctions.push(() => provider.off('display_uri', handleDisplayUri))
  cleanupFunctions.push(() => provider.off('session_ping', handleSessionPing))
  cleanupFunctions.push(() => provider.off('session_event', handleSessionEvent))
  cleanupFunctions.push(() => provider.off('session_update', handleSessionUpdate))
  cleanupFunctions.push(() => provider.off('session_delete', handleSessionDelete))
}

const DEFAULT_PROJECT_ID = '8e6877b49198d7a9f9561b8712805726'
const DEFAULT_RELAY_URL = 'wss://relay.walletconnect.com'
const DEFAULT_LOGGER = 'warn'
const DEFAULT_MAIN_CHAINS = [
  // mainnets
  'eip155:1',
  // 'eip155:10',
  // 'eip155:100',
  // 'eip155:137',
  // 'eip155:42161',
  // 'eip155:42220',
]
const DEFAULT_TEST_CHAINS = [
  // testnets
  'eip155:5',
  // 'eip155:69',
  // 'eip155:80001',
  // 'eip155:421611',
  // 'eip155:44787',
] 
const DEFAULT_CHAINS = [...DEFAULT_MAIN_CHAINS, ...DEFAULT_TEST_CHAINS]