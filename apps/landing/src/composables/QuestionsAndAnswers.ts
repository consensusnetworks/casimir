import { onMounted, onUnmounted, readonly, ref } from "vue"

const initializeComposable = ref(false)

const questionsAndAnswers = ref([
	{
		question: "What’s the minimum I can stake?",
		answer: "There is no minimum! However, there is a point at which gas fees make very small amounts staked not worth it.",
		link: ""
	},
	{
		question: "How are rewards generated?",
		answer: "Rewards are generated natively on the Ethereum beacon chain as if you were solo staking. Casimir pools users’ ETH into 32 ETH pools and builds a validator group of 4 operators using Distributed Validator Technology. Rewards are distributed to the users’ proportionate to their share of the 32 ETH in the pool. More information on how staking works here. Additionally, MEV and any other block rewards will be shared across validators. ",
		link: "https://ethereum.org/en/staking/#:~:text=Rewards%20are%20given%20for%20actions,keeps%20the%20chain%20running%20securely."
	},
	{
		question: "How does Casimir work?  What does it mean to create an account?",
		answer: "Casimir utilizes distributed validator technology to pool users’ ETH into 32 ETH pools that are distributed across four node operators. Individual users (stakers) are able to maintain custody of their ETH because of our use of distributed key generation (DKG). Rewards are managed through Casimir’s open source manager contract and distributed back to users in native ETH proportionate to their share of the 32 ETH in the pool. ",
		link: "https://github.com/RockX-SG/rockx-dkg-cli"
	},
	{
		question: "What are the advantages of staking with Casimir over other protocols?",
		answer: "Casimir is a first of its kind pooled staking solution that allows users to stake any amount of ETH while maintaining custody of their ethereum and receiving rewards in native ETH (not a secondary liquid staking token). Staking with Casimir gives you the flexibility and ease of use of a liquid staking protocol with the decentralization benefits of solo staking, the reward upside of solo staking and additional security because your stake is distributed across multiple validators (DVT). Additionally, because you are staking native ETH, you will be able to use solutions, like Eigenlayer, that liquid stakers are limited in their ability to access.",
		link: ""
	},
	{
		question: "What are the risks?",
		answer: " There is an inherent risk that Casimir could contain a smart contract vulnerability or bug. The Casimir code is open-sourced, audited, and covered by a bug bounty program to minimize this risk. To mitigate smart contract risks, all of the core Casimir contracts are audited. Validators/operators risk penalties, with up to 100% of staked funds at risk if validators/operators  fail. To minimize this risk, Casimir utilizes Distributed Validator Technology (DVT) so that failure of a validator/operator will not result in slashed or lost funds.",
		link: ""
	},
	{
		question: "Who is behind Casimir? Are the smart contracts audited and open source?",
		answer: "Casimir is being built by Consensus Networks, a US based team who have been active in crypto for several years. The team were early node operators in many PoS protocols and have been awarded grants from both Web3 and government grants for the development of digital asset management tools.",
		link: ""
	},
	{
		question: "What is Distributed Validator Technology (DVT)?",
		answer: "DVT supports Ethereum’s validation layer by distributing validator operations to the network’s multiple non-trusting nodes (a.k.a Operators). Clusters of operator nodes operate validators on behalf of the staker and simultaneously help solve the fundamental issues of centralization, redundancy, and security that exist within Ethereum’s PoS consensus.",
		link: "https://ssv.network/glossary/#operator"
	},
	{
		question: "Why don’t you use a Liquid Staking Derivative or Token (LSD or LST)?",
		answer: "There are inherent risks with LSDs, most significantly counterparty risk. Since the LSD is functionally an IOU, if the issuer of the LSD were to become insolvent, the user’s ETH could be lost forever.",
		link: ""
	},
	{
		question: "Are there ways I can use my staked ETH for additional yield?",
		answer: "Yes, although Casimir is not launching an LSD, there are opportunities for stakers to provide their native staked ETH to be used as a liquidity provider (to support a DAO, for example). Additionally, we will be onboarding restaking mechanisms like Eigenlayer that will allow users to natively restake their ETH to maximize their APR, if desired.",
		link: ""
	},
	{
		question: "Am I giving up custody of my staked ETH?",
		answer: "No! You will always be able to withdraw your staked ETH from your smart contract.",
		link: ""
	},
	{
		question: "How frequently do I get my rewards? ",
		answer: "Rewards will be distributed as they are awarded by the Ethereum protocol, at least daily.",
		link: ""
	},
	{
		question: "Where are my rewards distributed, is there a secondary token?",
		answer: "Your rewards will be distributed to your wallet, there is no need to deal with the hassle of swapping a token to get your rewards.",
		link: ""
	},
	{
		question: "What Wallets are supported?",
		answer: "Today we support Metamask, Wallet Connect, Trezor, Ledger, Trust Wallet and Coinbase Wallet.",
		link: ""
	},
	{
		question: "Is there a lockup period or waiting period for withdrawals? ",
		answer: "Since you are staking native ETH, there may be a wait time for a validator to exit to receive your withdrawal. If you desire a quicker exit, we will soon be launching a native ETH liquidity pool for those who wish for an instant withdrawal.",
		link: ""
	},
	{
		question: "Where is my stake going, who is running the validators?",
		answer: "Casimir is launching with a small set of validators but will soon open a permissionless set so that anyone can join for a small (1ETH) collateral. Validator performance is monitored by a decentralized oracle network to ensure performance and validator performance specs are made available and used in evaluation for the selection of validator operators.",
		link: ""
	},
	{
		question: "What is the fee?",
		answer: "There is a small fee, paid for by part of the block rewards to cover validator and other network payments to ensure Casimir keeps running.",
		link: ""
	},
	{
		question: "Can I run a validator?",
		answer: "If you have the technical ability and desire, you soon will be able to run a validator as part of our protocol. Today we are launching with a smaller set of white listed validators but will soon start opening to a permissionless set. Join our Discord for the latest updates.",
		link: ""
	},
])

  
export default function useQuestionsAndAnswers() {
	onMounted(() => {
		if (!initializeComposable.value) {
			initializeComposable.value = true
		}
        
	})
    
	onUnmounted(() =>{
		initializeComposable.value = false
	})

	return {
		questionsAndAnswers: readonly(questionsAndAnswers),
	}
}