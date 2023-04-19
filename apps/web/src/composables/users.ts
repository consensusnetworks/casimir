import { onMounted, ref } from 'vue'
import { AddAccountOptions, ProviderString, RemoveAccountOptions, UserWithAccounts } from '@casimir/types'
import { ethers } from 'ethers'
import useEnvironment from '@/composables/environment'
import useSSV from '@/composables/ssv'
import useWallet from '@/composables/wallet'
import * as Session from 'supertokens-web-js/recipe/session'

const { usersBaseURL, ethereumURL } = useEnvironment()

// 0xd557a5745d4560B24D36A68b52351ffF9c86A212
const session = ref<boolean>(false)
const user = ref<UserWithAccounts>()
// const user = ref(
//     {
//         address: '0xd557a5745d4560B24D36A68b52351ffF9c86A212'.toLowerCase(),
//         accounts: [
//             {
//                 address: '0xd557a5745d4560B24D36A68b52351ffF9c86A212'.toLowerCase(),
//                 currency: 'ETH',
//                 balance: '1000000000000000000',
//                 balanceSnapshots: [{ date: '2023-02-06', balance: '1000000000000000000' }, { date: '2023-02-05', balance: '100000000000000000' }],
//                 roi: 0.25,
//                 walletProvider: 'MetaMask'
//             },
//             {
//                 address: '0x1dc336d94890b10e1a47b6e34cdee1009ee7b942'.toLowerCase(),
//                 currency: 'ETH',
//                 balance: '1000000000000000000',
//                 balanceSnapshots: [{ date: '2023-02-06', balance: '1000000000000000000' }, { date: '2023-02-05', balance: '100000000000000000' }],
//                 roi: 0.25,
//                 walletProvider: 'CoinbaseWallet'
//             },
//             {
//                 address: '0x1dc336d94890b10e1a47b6e34cdee1009ee7b942'.toLowerCase(),
//                 currency: 'ETH',
//                 balance: '1000000000000000000',
//                 balanceSnapshots: [{ date: '2023-02-06', balance: '1000000000000000000' }, { date: '2023-02-05', balance: '100000000000000000' }],
//                 roi: 0.25,
//                 walletProvider: 'CoinbaseWallet'
//             },
//             {
//                 address: '0x1dc336d94890b10e1a47b6e34cdee1009ee7b942'.toLowerCase(),
//                 currency: 'ETH',
//                 balance: '1000000000000000000',
//                 balanceSnapshots: [{ date: '2023-02-06', balance: '1000000000000000000' }, { date: '2023-02-05', balance: '100000000000000000' }],
//                 roi: 0.25,
//                 walletProvider: 'CoinbaseWallet'
//             },
//             {
//                 address: '0x8222Ef172A2117D1C4739E35234E097630D94376'.toLowerCase(),
//                 currency: 'ETH',
//                 balance: '1000000000000000000',
//                 balanceSnapshots: [{ date: '2023-02-06', balance: '1000000000000000000' }, { date: '2023-02-05', balance: '100000000000000000' }],
//                 roi: 0.25,
//                 walletProvider: 'Ledger'
//             },
//             {
//                 address: '0x8222Ef172A2117D1C4739E35234E097630D94377'.toLowerCase(), // Fake address
//                 currency: 'ETH',
//                 balance: '1000000000000000000',
//                 balanceSnapshots: [{ date: '2023-02-06', balance: '1000000000000000000' }, { date: '2023-02-05', balance: '100000000000000000' }],
//                 roi: 0.25,
//                 walletProvider: 'Trezor'
//             },
//             {
//                 address: '0x8222Ef172A2117D1C4739E35234E097630D94378'.toLowerCase(), // Fake address
//                 currency: 'ETH',
//                 balance: '1000000000000000000',
//                 balanceSnapshots: [{ date: '2023-02-06', balance: '1000000000000000000' }, { date: '2023-02-05', balance: '100000000000000000' }],
//                 roi: 0.25,
//                 walletProvider: 'WalletConnect'
//             },
//         ],
//         nonce: '1234567890',
//         pools: []
//     }
// )
const { casimirManager, getPools } = useSSV()

export default function useUsers () {

    async function addAccount(account: AddAccountOptions): Promise<{ error: boolean, message: string, data: UserWithAccounts | null }> {
        const requestOptions = {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ account })
        }
        const response = await fetch(`${usersBaseURL}/user/add-sub-account`, requestOptions)
        const { data: userAccount } = await response.json()
        user.value = userAccount
        return { error: false, message: `Account added to user: ${userAccount}`, data: userAccount }
    }

    /**
     * Checks if session exists and, if so: 
     * Gets the user's account via the API
     * Sets the user's account locally
    */
    async function checkUserSessionExists() : Promise<boolean> {
        try {
            session.value = await Session.doesSessionExist()
            if (session.value) {
                const user = await getUser()
                if (user) {
                    setUser(user)
                    return true
                } else {
                    return false
                }
            }
            return false
        } catch (error) {
            console.log('Error in checkUserSessionExists in wallet.ts :>> ', error)
            return false
        }
    }

    async function getMessage(address: string) {
        const response = await fetch(`${usersBaseURL}/auth/${address}`)
        const json = await response.json()
        const { message } = json
        return message
    }

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

    // onMounted(async () => {
    //     const { getUserBalance } = useWallet()
    //     // Just get pools for primary account for demo
    //     user.value.balance = ethers.utils.formatEther(await getUserBalance(user.value.id))
    //     user.value.pools = await getPools(user.value.id)
    //     subscribeToUserEvents()
    // })

    async function removeAccount({ address, currency, ownerAddress, walletProvider }: RemoveAccountOptions) {
        address = address.toLowerCase()
        const requestOptions = {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                address,
                currency,
                ownerAddress,
                walletProvider,
            })
        }
        const response = await fetch(`${usersBaseURL}/user/remove-sub-account`, requestOptions)
        const { data: userAccount } = await response.json()
        user.value = userAccount
        return { error: false, message: `Account removed from user: ${userAccount}`, data: userAccount }
    }

    function setUser(newUser?: UserWithAccounts) {
        user.value = newUser
    }

    // Todo filter for events for user addresses
    function subscribeToUserEvents() {
        const { getUserBalance } = useWallet()
        const provider = new ethers.providers.JsonRpcProvider(ethereumURL)
    
        const validatorInitFilter = {
          address: casimirManager.address,
          topics: [
            // ethers.utils.id('ManagerDistribution(address,uint256,uint256,uint256)'), // TODO: Make sure to query for past events on page load (Fetch and then subscribe),
            ethers.utils.id('PoolStaked(uint32)'),
          ]
        }
        casimirManager.connect(provider).on(validatorInitFilter, async () => {
          console.log('ValidatorInit event... updating pools')
          user.value.balance = await getUserBalance()
          user.value.pools = await getPools(user.value.id)
          user.value.stake = user.value.pools?.reduce((a, c) => a + parseFloat(c.userStake), 0).toString()
          user.value.rewards = user.value.pools?.reduce((a, c) => a + parseFloat(c.userRewards), 0).toString()
        })
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
        session,
        user,
        addAccount,
        checkUserSessionExists,
        getMessage,
        getUser,
        removeAccount,
        setUser,
        updatePrimaryAddress
    }
}