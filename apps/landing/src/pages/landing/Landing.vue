<script lang="ts" setup>
import { ref } from 'vue'

const appUrl = import.meta.env.PUBLIC_APP_URL || 'https://app.dev.casimir.co'
const docsUrl = import.meta.env.PUBLIC_DOCS_URL || 'https://docs.dev.casimir.co'
const faqItems = ref(
  [
    {
      question: 'Are there ways I can use my staked ETH for additional yield?',
      answer: 'We will be introducing restaking mechanisms like EigenLayer that will enable users to natively restake their ETH to maximize their APR, if desired.',
      open: false,
    },
    {
      question: 'Am I giving up custody of my staked ETH?',
      answer: 'No! Validator keys are generated with distributed key generation (DKG) and split between operators. You will always be able to withdraw your staked ETH from the Casimir smart contract.',
      open: false,
    },
    {
      question: 'How frequently do I get my rewards?',
      answer: 'Rewards are accumulated at least daily when they are validated by a decentralized oracle network.',
      open: false,
    },
    {
      question: 'How can I withdraw my stake or rewards?',
      answer: 'You can request a partial or full withdrawal of your stake plus rewards any time. The amount will be sent from your contract stake account to your wallet.',
      open: false,
    },
    {
      question: 'Is there a waiting period for withdrawals?',
      answer: 'Most smaller withdrawals can be made near-instantly. Medium withdrawals may take up to a day. Larger withdrawals (>32 ETH) may take up to four days depending on the Ethereum Beacon chain exit queue.',
      open: false,
    },
    {
      question: 'Is there a secondary token?',
      answer: 'No, by default you can manage your stake with native ETH. We will provide opt-in staking strategies for secondary features, like a token, in the near future.'
    },
    {
      question: 'Which wallets are supported?',
      answer: 'Today we natively support Metamask, Coinbase Wallet, Trust Wallet, Ledger, and Trezor. We also support most other providers through the WalletConnect protocol.',
      open: false,
    },
    {
      question: 'What are the staking fees?',
      answer: 'The Casimir smart contract charges a user a 5% fee on deposits and rewards to cover operational expenses including oracle gas fees and payments to the distributed set of independently owned operators.',
      open: false,
    },
    {
      question: 'Who is running the validators?',
      answer: 'Casimir validators are run with a diverse group of independently owned operators using distributed validator technology (DVT). We are launching with a small set of vetted operator partners, but we will soon allow anyone with at least 1 ETH collateral to run an operator. Operator performance is overseen by a decentralized oracle network with performance specs used in operator selection.',
      open: false,
    },
    {
      question: 'Can I run an operator?',
      answer: 'If you have the technical ability and interest, you\'ll soon have the chance to register as a Casimir operator. While we\'re initially launching with a small group of white-listed operators, we\'ll soon open up to everyone. Stay updated by joining our Discord.',
      open: false,
    },
  ],
)

const toggleQuestionItem = (index: number) => {
  faqItems.value[index].open = !faqItems.value[index].open
} 
</script>

<template>
  <div>
    <nav class="nav">
      <div class="nav__container">
        <a href="/">
          <img
            class="logo"
            src="/logo.svg"
          >
        </a>
        <ul class="nav__links">
          <li>
            <a href="/blog">Blog</a>
          </li>
          <li>
            <a href="/changelog">Changelog</a>
          </li>
          <li>
            <a
              href="https://consensusnetworks.com"
              target="_blank"
            >Company</a>
          </li>
          <li>
            <a
              :href="docsUrl"
              target="_blank"
            >Docs</a>
          </li>
        </ul>
      </div>
    </nav>

    <section class="hero">
      <div class="hero__container">
        <div class="text__container">
          <span class="pill">Beta</span>
          <h1 class="text-1">
            Get the most from your staked Ethereum
            <br>
          </h1>
          <!-- <span class="text-r">
            Casimir allows you to natively stake any amount of Ethereum to a decentralized
            set<br />of validators and earn native ETH (no LSDs/LSTs) without
            giving up custody.
          </span> -->
        </div>
        <div class="cta__container">
          <a
            :href="appUrl"
            class="btn-primary"
          >
            Launch Staking App
          </a>
          <a
            href="https://drive.google.com/file/d/1giIojTS-4gf0xWXUirmd2AaqalFmgA72/view"
            class="btn-secondary"
          >
            Read the Whitepaper
          </a>
        </div>
      </div>
      <div class="mockup">
        <img src="/hero-new.png">
      </div>
    </section>

    <section class="overview">
      <div class="overview__header">
        <span class="highlight text-8">Minimized Risk & Maximized Rewards</span>
        <h2>
          Casimir is built to maximize your rewards <br>
          without compromising security.
        </h2>
      </div>
      <!-- <div class="mock"><img src="/hero.png" /></div> -->
      <div class="overview__container">
        <div class="overview__item">
          <div class="overview__item__header">
            <div class="icon">
              <img
                src="/disc.svg"
                width="17"
              >
            </div>
            <span class="text-7 bold">Maximize your Yield</span>
          </div>
          <span class="text-r">
            Integrate with features like Restaking on EigenLayer to increase your stake yield.
          </span>
        </div>

        <div class="overview__item">
          <div class="overview__item__header">
            <div class="icon">
              <img
                src="/key.svg"
                width="17"
              >
            </div>
            <span class="text-7 bold">No Single Points of Failure</span>
          </div>
          <span class="text-r">
            Distributed validator technology (DVT) greatly mitigates loss of
            funds due to slashing.
          </span>
        </div>

        <div class="overview__item">
          <div class="overview__item__header">
            <div class="icon">
              <img
                src="/disc.svg"
                width="17"
              >
            </div>
            <span class="text-7 bold">Non-Custodial (DKG)</span>
          </div>
          <span class="text-r">
            Validator keys created and held across operators with distributed key
            generation (DKG).
          </span>
        </div>

        <div class="overview__item">
          <div class="overview__item__header">
            <div class="icon">
              <img
                src="/flash.svg"
                width="17"
              >
            </div>
            <span class="text-7 bold">You're In Control</span>
          </div>
          <span class="text-r">
            You can stake any amount and withdraw at any time.
          </span>
        </div>

        <div class="overview__item">
          <div class="overview__item__header">
            <div class="icon">
              <img
                src="/credit-card.svg"
                width="17"
              >
            </div>
            <span class="text-7 bold">Incentives Drive Rewards</span>
          </div>
          <span class="text-r">
            Operators are incentivized to provide the best service to earn your
            stake.
          </span>
        </div>

        <div class="overview__item">
          <div class="overview__item__header">
            <div class="icon">
              <img
                src="/users.svg"
                width="17"
              >
            </div>
            <span class="text-7 bold">Permissionless & Auditable</span>
          </div>
          <span class="text-r">
            Casimir is open-sourced; anyone can use and review the service.
          </span>
        </div>
      </div>
    </section>

    <section class="bento">
      <h2 class="">
        One place to connect your <br>wallets, stake, and see your analytics.
      </h2>
      <div class="bento__container">
        <div class="bento__base__card bento__card__1">
          <h2 class="text-6">
            Simple self-custodial <br>Ethereum staking
          </h2>
          <div><img src="/tx.png"></div>
        </div>

        <div class="bento__base__card bento__card__4">
          <h2 class="text-6">
            Natively stake or withdraw ETH.
          </h2>
          <div><img src="/staking-component.png"></div>
        </div>

        <div class="bento__base__card bento__card__3">
          <h2 class="text-6">
            Track all of your historical balances, rewards, and  <br> withdrawals in one dashboard.
          </h2>
          <div><img src="/analytics-chart.png"></div>
        </div>

        <div class="bento__base__card bento__card__2">
          <h2 class="text-6">
            Connect any number of wallets at the same time.
          </h2>
          <div><img src="/multi-wallet.png"></div>
        </div>
      </div>
    </section>

    <!-- <section class="roadmap">
      <div class="roadmap__header">
        <span class="highlight text-8">Minimized Risk & Maximized Rewards</span>
        <h2>
          Casimir is built to maximize your rewards <br />
          without compromising security.
        </h2>
      </div>
      <div class="roadmap__item__container">
        <div class="roadmap__item done">
          <div class="roadmap__item__point">1</div>
          <span class="text-7">Internal Testnet</span>
        </div>

        <div class="roadmap__item done">
          <div class="roadmap__item__point">2</div>
          <span class="highlight">Goerli Launch</span>
        </div>

        <div class="roadmap__item done">
          <div class="roadmap__item__point">3</div>
          <span class="highlight">Mainnet Beta</span>
        </div>

        <div class="roadmap__item">
          <div class="roadmap__item__point">4</div>
          <span class="highlight">Mainnet Launch</span>
        </div>

        <div class="roadmap__item">
          <div class="roadmap__item__point">5</div>
          <span class="highlight">Eigenlayer Restaking</span>
        </div>
      </div>
    </section> -->

    <section class="faq">
      <h2>Frequently Asked Questions</h2>

      <div class="faq__container w-full">
        <div
          v-for="(item, index) in faqItems"
          :key="index"
          class="faq__item"
        >
          <div
            class="faq__item__q"
            @click="toggleQuestionItem(index)"
          >
            <span class="text-7">{{ item.question }}</span>
            <span :class="{ 'text-5': !item.open, 'text-6': item.open }">
              {{ item.open ? '-' : '+' }}
            </span>
          </div>
          <div
            v-if="item.open"
            class="faq__item__a"
          >
            <span class="text-r">{{ item.answer }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="footer">
      <div class="footer__container">
        <span class="c">© 2023 Consensus Networks. All rights reserved.</span>
        <ul>
          <li>
            <a
              href="/"
              target="_blank"
            >Discord</a>
          </li>
          <li>
            <a
              href="https://github.com/consensusnetworks/casimir"
              target="_blank"
            >GitHub</a>
          </li>
          <li>
            <a
              href="/"
              target="_blank"
            >Contact Us</a>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>


<style scoped></style>