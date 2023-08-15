<script lang="ts" setup>
import { ref, onBeforeUnmount, onMounted } from 'vue'
import { providers } from 'ethers'
import { Web3Modal } from '@web3modal/standalone'
import UniversalProvider from '@walletconnect/universal-provider'
import { PairingTypes, SessionTypes } from '@walletconnect/types'
import { apiGetChainNamespace, ChainsMap } from 'caip-api'
import Client from '@walletconnect/sign-client'

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

interface IContext {
    client: Client | undefined;
    session: SessionTypes.Struct | undefined;
    connect: (caipChainId: string, pairing?: { topic: string }) => Promise<void>;
    disconnect: () => Promise<void>;
    isInitializing: boolean;
    chain: string;
    pairings: PairingTypes.Struct[];
    accounts: string[];
    balances: AccountBalances;
    isFetchingBalances: boolean;
    chainData: ChainNamespaces;
    web3Provider?: providers.Web3Provider;
}

const DEFAULT_PROJECT_ID = '8e6877b49198d7a9f9561b8712805726'
const DEFAULT_RELAY_URL = 'wss://relay.walletconnect.com'
const DEFAULT_LOGGER = 'warn'
const DEFAULT_MAIN_CHAINS = [
    // mainnets
    'eip155:1',
    'eip155:10',
    'eip155:100',
    'eip155:137',
    'eip155:42161',
    'eip155:42220',
]
const DEFAULT_TEST_CHAINS = [
    // testnets
    'eip155:5',
    'eip155:69',
    'eip155:80001',
    'eip155:421611',
    'eip155:44787',
] 
const DEFAULT_CHAINS = [...DEFAULT_MAIN_CHAINS, ...DEFAULT_TEST_CHAINS]

const client = ref<Client | null>(null)
const session = ref<SessionTypes.Struct | null>(null)
const pairings = ref<PairingTypes.Struct[]>([])
const ethereumProvider = ref<UniversalProvider | null>(null)
const web3Provider = ref<providers.Web3Provider | null>(null)
const isFetchingBalances = ref(false)
const isInitializing = ref(false)
const hasCheckedPersistedSession = ref(false)
const balances = ref<AccountBalances | null>(null)
const accounts = ref<string[]>([])
const chainData = ref<ChainNamespaces | null>(null)
const chain = ref<string>('')
const web3Modal = ref<Web3Modal | null>(null)
let cleanupFunctions: Array<any> = [] // TODO: Potentially fix type here.

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
    await _checkForPersistedSession(ethereumProvider.value as UniversalProvider)
    hasCheckedPersistedSession.value = true
  }

  console.log('ethereumProvider.value :>> ', ethereumProvider.value)

  if (ethereumProvider.value) {
    console.log('subscribing started')
    _subscribeToProviderEvents(ethereumProvider.value as UniversalProvider)
  }
})


async function connect(caipChainId: string, pairing?: { topic: string }) {
  if (!ethereumProvider.value) {
    throw new ReferenceError('WalletConnect Client is not initialized.')
  }

  const chainId = caipChainId.split(':').pop()

  console.log('Enabling EthereumProvider for chainId: ', chainId)
  console.log('ethereumProvider.value :>> ', ethereumProvider.value)

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
            rpcMap: {chainId: `https://rpc.walletconnect.com?chainId=eip155:${chainId}&projectId=${DEFAULT_PROJECT_ID}`,},
          },
        },
        pairingTopic: pairing?.topic,
      })
    
      createWeb3Provider(ethereumProvider.value as UniversalProvider)
      const _accounts = await ethereumProvider.value.enable()
      console.log('_accounts', _accounts)
      accounts.value = _accounts
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

async function createClient() {
    isInitializing.value = true

    if (!DEFAULT_PROJECT_ID) {
        console.log('There is no project ID set for WalletConnect')
        return
    }

    const provider = await UniversalProvider.init({
        projectId: DEFAULT_PROJECT_ID,
        logger: DEFAULT_LOGGER,
        relayUrl: DEFAULT_RELAY_URL,
    })

    const localWeb3Modal = new Web3Modal({
        projectId: DEFAULT_PROJECT_ID,
        walletConnectVersion: 2,
    })

    ethereumProvider.value = provider as UniversalProvider
    client.value = provider.client
    web3Modal.value = localWeb3Modal
}

function createWeb3Provider(provider: UniversalProvider) {
  const localWeb3Provider = new providers.Web3Provider(provider)
  web3Provider.value = localWeb3Provider
}

async function disconnect() {
  if (!ethereumProvider.value) {
    throw new Error('ethereumProvider is not initialized')
  }
  await ethereumProvider.value.disconnect()
  resetApp()
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

async function loadChainData() {
  const namespaces = getAllChainNamespaces()
  const localChainData: ChainNamespaces = {}
  await Promise.all(
    namespaces.map(async (namespace: any) => {
      let chains: ChainsMap | undefined
      try {
        chains = await apiGetChainNamespace(namespace)
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
  accounts.value = allNamespaceAccounts.map(account => account.split(':')[2])
  createWeb3Provider(ethereumProvider.value as UniversalProvider)
}

function resetApp() {
  pairings.value = []
  session.value = null
  balances.value = {}
  accounts.value = []
  chain.value = ''
}

async function _checkForPersistedSession(provider: UniversalProvider) {
  if (typeof provider === 'undefined') {
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

function _subscribeToProviderEvents(provider: UniversalProvider) {
  // Event handler for display_uri
  const handleDisplayUri = (uri: string) => {
    console.log('EVENT', 'QR Code Modal open')
    web3Modal.value?.openModal({ uri })
  }

  // Event handler for session_ping
  const handleSessionPing = ({ id, topic }: { id: number; topic: string }) => {
    console.log('EVENT', 'session_ping')
    console.log(id, topic)
  }

  // Event handler for session_event
  const handleSessionEvent = ({ event, chainId }: { event: any; chainId: string }) => {
    console.log('EVENT', 'session_event')
    console.log(event, chainId)
  }

  // Event handler for session_update
  const handleSessionUpdate = ({ topic, _session }: { topic: string; _session: SessionTypes.Struct }) => {
    console.log('EVENT', 'session_updated')
    session.value = _session
  }

  // Event handler for session_delete
  const handleSessionDelete = ({ id, topic }: { id: number; topic: string }) => {
    console.log('EVENT', 'session_deleted')
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
</script>
  
<template>
  <div>
    <!-- Display the QR Code Modal if it's available -->
    <Web3Modal
      v-if="web3Modal"
      :modal="web3Modal"
    />
  
    <!-- Display connected session information -->
    <div v-if="session">
      <h3>Connected to: {{ chain }}</h3>
      <p>Accounts: {{ accounts.join(', ') }}</p>
      <button @click="disconnect">
        Disconnect
      </button>
    </div>
  
    <!-- Display a connect button if not connected -->
    <div v-else>
      <button
        class="border border-gray-300 rounded-md px-4 py-2 m-2"
        @click="() => connect('eip155:1')"
      >
        Connect to Mainnet
      </button>
      <button 
        class="border border-gray-300 rounded-md px-4 py-2 m-2"
        @click="() => connect('eip155:5')"
      >
        Connect to Goerli
      </button>
    </div>
  
    <!-- Display account balances -->
    <div v-if="balances && Object.keys(balances).length">
      <h4>Account Balances:</h4>
      <ul>
        <li
          v-for="(balance, account) in balances"
          :key="account"
        >
          {{ account }}: {{ balance.balance }} {{ balance.symbol }}
        </li>
      </ul>
    </div>
  
    <!-- Default slot for nested components or content -->
    <slot />
  </div>
</template>
  
    