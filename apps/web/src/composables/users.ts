import { ethers } from 'ethers'
import useEnvironment from '@/composables/environment'
import useSSV from '@/composables/ssv'
import useWallet from '@/composables/wallet'
import { onMounted, ref } from 'vue'
import { User } from '@casimir/types'
import { Account } from '@casimir/types'
import { Currency } from '@casimir/types'
import { ProviderString } from '@casimir/types'

const { usersBaseURL, ethereumURL } = useEnvironment()

// 0xd557a5745d4560B24D36A68b52351ffF9c86A212
// const user = ref<User>()
const user = ref(
    {
        address: '0xd557a5745d4560B24D36A68b52351ffF9c86A212'.toLowerCase(),
        accounts: [
            {
                address: '0xd557a5745d4560B24D36A68b52351ffF9c86A212'.toLowerCase(),
                currency: 'ETH',
                balance: '1000000000000000000',
                balanceSnapshots: [{ date: '2023-02-06', balance: '1000000000000000000' }, { date: '2023-02-05', balance: '100000000000000000' }],
                roi: 0.25,
                walletProvider: 'MetaMask'
            },
            {
                address: '0x1dc336d94890b10e1a47b6e34cdee1009ee7b942'.toLowerCase(),
                currency: 'ETH',
                balance: '1000000000000000000',
                balanceSnapshots: [{ date: '2023-02-06', balance: '1000000000000000000' }, { date: '2023-02-05', balance: '100000000000000000' }],
                roi: 0.25,
                walletProvider: 'CoinbaseWallet'
            },
            {
                address: '0x1dc336d94890b10e1a47b6e34cdee1009ee7b942'.toLowerCase(),
                currency: 'ETH',
                balance: '1000000000000000000',
                balanceSnapshots: [{ date: '2023-02-06', balance: '1000000000000000000' }, { date: '2023-02-05', balance: '100000000000000000' }],
                roi: 0.25,
                walletProvider: 'CoinbaseWallet'
            },
            {
                address: '0x1dc336d94890b10e1a47b6e34cdee1009ee7b942'.toLowerCase(),
                currency: 'ETH',
                balance: '1000000000000000000',
                balanceSnapshots: [{ date: '2023-02-06', balance: '1000000000000000000' }, { date: '2023-02-05', balance: '100000000000000000' }],
                roi: 0.25,
                walletProvider: 'CoinbaseWallet'
            },
            {
                address: '0x8222Ef172A2117D1C4739E35234E097630D94376'.toLowerCase(),
                currency: 'ETH',
                balance: '1000000000000000000',
                balanceSnapshots: [{ date: '2023-02-06', balance: '1000000000000000000' }, { date: '2023-02-05', balance: '100000000000000000' }],
                roi: 0.25,
                walletProvider: 'Ledger'
            },
            {
                address: 'bc1qpttwf0df8jkx54dl04anwgmyt27lj6vj885lyr'.toLowerCase(),
                currency: 'BTC',
                balance: '100000000',
                balanceSnapshots: [{ date: '2023-02-06', balance: '100000000' }, { date: '2023-02-05', balance: '100000000' }],
                roi: 0.25,
                walletProvider: 'Ledger'
            },
            {
                address: '0x8222Ef172A2117D1C4739E35234E097630D94377'.toLowerCase(), // Fake address
                currency: 'ETH',
                balance: '1000000000000000000',
                balanceSnapshots: [{ date: '2023-02-06', balance: '1000000000000000000' }, { date: '2023-02-05', balance: '100000000000000000' }],
                roi: 0.25,
                walletProvider: 'Trezor'
            },
            {
                address: '0x8222Ef172A2117D1C4739E35234E097630D94378'.toLowerCase(), // Fake address
                currency: 'ETH',
                balance: '1000000000000000000',
                balanceSnapshots: [{ date: '2023-02-06', balance: '1000000000000000000' }, { date: '2023-02-05', balance: '100000000000000000' }],
                roi: 0.25,
                walletProvider: 'WalletConnect'
            },
        ],
        nonce: '1234567890',
        pools: []
    }
)
const { ssvManager } = useSSV()

export default function useUsers () {

    async function getUser() {
        const requestOptions = {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json'
            }
        }
        const response = await fetch(`${usersBaseURL}/user`, requestOptions)
        const { user } = await response.json()
        return user
    }

    function setUser(newUser?: User) {
        user.value = newUser
    }

    // Todo filter for events for user addresses
    function subscribeToUserEvents() {
        const { getUserBalance, getUserPools } = useWallet()
        const provider = new ethers.providers.JsonRpcProvider(ethereumURL)
    
        const validatorInitFilter = {
          address: ssvManager.address,
          topics: [
            ethers.utils.id('ValidatorActivated(uint32,uint32[],string)')
          ]
        }
        ssvManager.connect(provider).on(validatorInitFilter, async () => {
          console.log('ValidatorInit event... updating pools')
          user.value.balance = ethers.utils.formatEther(await getUserBalance(user.value.id))
          user.value.pools = await getUserPools(user.value.id)
          user.value.stake = user.value.pools?.reduce((a, c) => a + parseFloat(c.userStake), 0).toString()
          user.value.rewards = user.value.pools?.reduce((a, c) => a + parseFloat(c.userRewards), 0).toString()
        })
    }

    // onMounted(async () => {
    //     const { getUserBalance, getUserPools } = useWallet()
    //     // Just get pools for primary account for demo
    //     user.value.balance = ethers.utils.formatEther(await getUserBalance(user.value.id))
    //     user.value.pools = await getUserPools(user.value.id)
    //     subscribeToUserEvents()
    // })

    async function addAccount(provider: ProviderString, address: string, currency: Currency): Promise<{ error: boolean, message: string, data: User | null }> {
        address = address.toLowerCase()
        const account = user.value?.accounts?.find((account: Account) => {
            const accountAddress = account.address.toLowerCase()
            const accountProvider = account.walletProvider
            const accountCurrency = account.currency
            const addressIsEqual = accountAddress === address
            const providerIsEqual = accountProvider === provider
            const currencyIsEqual = accountCurrency === currency
            const isEqual = addressIsEqual && providerIsEqual && currencyIsEqual
            return isEqual
        }) as Account
        if (account) {
            return { error: false, message: `Account already exists on user: ${account}`, data: user.value }
        } else {
            const accountToAdd = {
                address,
                currency,
                balance: '0', // TODO: Decide how we want to handle this
                balanceSnapshots: [],
                roi: 0,
                walletProvider: provider
            }
            const requestOptions = {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    address: user.value?.address,
                    account: accountToAdd
                })
            }
            const response = await fetch(`${usersBaseURL}/user/add-sub-account`, requestOptions)
            const { data: userAccount } = await response.json()
            user.value = userAccount
            return { error: false, message: `Account added to user: ${userAccount}`, data: userAccount }
        }
    }

    // TODO: Refactor this next. 2/14
    async function removeAccount(provider: ProviderString, address: string, currency: Currency) {
        address = address.toLowerCase()
        const requestOptions = {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                primaryAddress: user.value?.address,
                provider,
                address,
                currency
            })
        }
        return await fetch(`${usersBaseURL}/user/remove-sub-account`, requestOptions)
    }
    
    async function getMessage(address: string) {
        const response = await fetch(`${usersBaseURL}/auth/${address}`)
        const json = await response.json()
        const { message } = json
        return message
    }

    async function updatePrimaryAddress(primaryAddress: string, updatedProvider: ProviderString, updatedAddress: string) {
        const requestOptions = {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ primaryAddress, updatedProvider, updatedAddress })
        }
        return await fetch(`${usersBaseURL}/users/update-primary-account`, requestOptions)
    }

    return {
        user,
        getUser,
        setUser,
        addAccount,
        removeAccount,
        getMessage,
        updatePrimaryAddress
    }
}