<script lang="ts" setup>
</script>

<template>
  <div class="grid grid-cols-6 gap-gutter p-margins px-[220px] ">
    <div class="col-span-6 ">
      <h4 class="text-[#d9d9d9] font-bold my-[35px]">
        Why we're building Casimir
      </h4>
      <h6 class="text-justify leading-7 my-[20px] tracking-wide">
        It’s always a good idea to revisit your priorities and values especially
        in this time of uncertainty in blockchain, cryptocurrency, Web3, and 
        technology at large. 
        <a
          href="https://blog.consensusnetworks.com/nist/"
          target="_blank"
          class="px-[10px] pt-[2px]  text-primary hover:bg-blue_1 tooltip"
        ><i class="iconoir-link inline-block" />
          <span class="tooltiptext text-body">https://blog.consensusnetworks.com/nist/</span>
        </a>
        We’ve written before about what the value 
        proposition of blockchain is and why we’re building technology as close
        to the consensus layer as possible. Fundamentally, the consensus mechanism 
        is what powers a new medium; exchange of value without the need for a third 
        party, peer to peer transactions. It’s clear that many of the current issues
        in the crypto space today are due to egregious speculative activity and 
        attempted takeovers from centralized entities acting far away from the 
        consensus layer.
      </h6>
      <h6 class="text-justify leading-7 my-[50px] tracking-wide">
        We’ll briefly touch on some recent issues in the Web3 space, the major 
        reasons we think they occurred, and why we’re building Casimir to help fix this.
      </h6>
      <div class="grid grid-cols-2 csm:grid-cols-1 gap-margins">
        <div class="col-span-1">
          <h5 class="text-[#d9d9d9] font-semibold my-[35px]">
            Bridge Attacks
          </h5>
          <h6 class="text-justify leading-7 my-[20px] tracking-wide">
            In February 2022, the DeFi platform  
            <a
              href="https://www.theverge.com/2022/2/3/22916111/wormhole-hack-github-error-325-million-theft-ethereum-solana"
              target="_blank"
              class="px-[10px] pt-[2px]  text-primary hover:bg-blue_1 tooltip"
            >
              <i class="iconoir-link inline-block" />
              <span class="tooltiptext text-body">
                https://www.theverge.com/2022/2/3/22916111/wormhole-hack-github-error-325-million-theft-ethereum-solana
              </span>
            </a>
            Wormhole was exploited for $325 million. 
            Wormhole was a popular VC backed blockchain bridge designed to allow users to 
            access tokens across chains using a single access point. More recently the 
            <a
              href="https://decrypt.co/111433/binance-smart-chain-hack"
              target="_blank"
              class="px-[10px] pt-[2px]  text-primary hover:bg-blue_1 tooltip"
            >
              <i class="iconoir-link inline-block" />
              <span class="tooltiptext text-body">https://decrypt.co/111433/binance-smart-chain-hack</span>
            </a>
            Binance Smart Chain was exploited for $100M+. While bridges are a potentially 
            convenient solution to the mass of protocols in existence, a single smart 
            contract or hot wallet with $100M+ of deposited tokens is proving to be too 
            attractive of a target for hackers. So far in 2022, $2B worth of tokens on 
            bridges have been hacked!
          </h6>
        </div>

        <div class="col-span-1">
          <h5 class="text-[#d9d9d9] font-semibold my-[35px]">
            Decentralized in Name Only
          </h5>
          <h6 class="text-justify leading-7 my-[20px] tracking-wide">
            The first of the warning bells of the impending 2022 crypto sell off was 
            the collapse of Terra. There are a range of reasons why Terra collapsed but 
            simply, algorithmic stable coins backed by digital assets have fundamental 
            challenges due to the volatile nature of digital assets. 
            <a
              href="https://newsletter.stakingrewards.com/p/terra-staking-rewards-special-comment"
              target="_blank"
              class="px-[10px] pt-[2px]  text-primary hover:bg-blue_1 tooltip"
            >
              <i class="iconoir-link inline-block" />
              <span class="tooltiptext text-body">
                https://newsletter.stakingrewards.com/p/terra-staking-rewards-special-comment
              </span>
            </a>
            This early breakdown from Staking Rewards names a comyination of an 
            overreliance on the yield platform Anchor comyined with significant 
            off-chain usage on exchanges being a driving factor in the collapse of Terra. 
            Those externalities, controlled by central entities, effectively subverted 
            the consensus mechanism of the project by operating off-chain where 
            overleveraged risk could not be observed. Additional issues were caused 
            by a concentration of premined tokens in the hands of Terraform Labs who 
            essentially controlled protocol voting and overrode the desires of some in 
            the community to reduce risks. A more recent postmortem in June 2022 
            showed that the liquidity issues and subsequent depegging of the UST 
            stable coin were 
            <a
              href="http://www.coindeskkorea.com/news/articleView.html?idxno=79890"
              target="_blank"
              class="px-[10px] pt-[2px]  text-primary hover:bg-blue_1 tooltip"
            >
              <i class="iconoir-link inline-block" />
              <span class="tooltiptext text-body">
                http://www.coindeskkorea.com/news/articleView.html?idxno=79890
              </span>
            </a>
            caused by Terraform Labs themselves.
          </h6>
        </div>
      </div>

      <h5 class="text-[#d9d9d9] font-semibold my-[35px]">
        The Rise and Fall of CeDeFi
      </h5>
      <h6 class="text-justify leading-7 my-[20px] tracking-wide">
        Next to fall, and 
        <a
          href="https://www.wsj.com/articles/celsius-network-taps-more-advisers-to-prepare-for-potential-bankruptcy-11656088078"
          target="_blank"
          class="px-[10px] pt-[2px]  text-primary hover:bg-blue_1 tooltip"
        >
          <i class="iconoir-link inline-block" />
          <span class="tooltiptext text-body">
            https://www.wsj.com/articles/celsius-network-taps-more-advisers-to-prepare-for-potential-bankruptcy-11656088078              
          </span>
        </a>
        still unwinding, is the “Centralized Decentralized Finance” (CeDeFi) company 
        Celsius. Companies like Celsius and BlockFi have driven huge growth in crypto 
        by offering high interest rate yields on your deposited tokens. They act as a 
        bank but don’t do a good job of indicating the potential risk their 
        depositors face nor do they follow the same regulations as traditional banks. 
        <a
          href="https://twitter.com/JackNiewold/status/1536402475418263554"
          target="_blank"
          class="px-[10px] pt-[2px]  text-primary hover:bg-blue_1 tooltip"
        >
          <i class="iconoir-link inline-block" />
          <span class="tooltiptext text-body">
            https://twitter.com/JackNiewold/status/1536402475418263554          
          </span>
        </a>
        Celsius was exposed to Terra and potentially lost $500M there alone. More 
        recent are revelations that 
        <a
          href="https://www.forbes.com/sites/ninabamyysheva/2022/10/06/celsius-executives-cashed-out-shortly-before-bankruptcy/"
          target="_blank"
          class="px-[10px] pt-[2px]  text-primary hover:bg-blue_1 tooltip"
        >
          <i class="iconoir-link inline-block" />
          <span class="tooltiptext text-body">
            https://www.forbes.com/sites/ninabamyysheva/2022/10/06/celsius-executives-cashed-out-shortly-before-bankruptcy/
          </span>
        </a>
        Celsius executives cashed out just prior to the collapse and bankruptcy filing.
      </h6>
      <h6 class="text-justify leading-7 my-[20px] tracking-wide">
        Last of the 
        <a
          href="https://fortune.com/2022/05/12/crypto-crash-contagion-systemic-risk-financial-crisis-lehman-brothers/"
          target="_blank"
          class="px-[10px] pt-[2px]  text-primary hover:bg-blue_1 tooltip"
        >
          <i class="iconoir-link inline-block" />
          <span class="tooltiptext text-body">
            https://fortune.com/2022/05/12/crypto-crash-contagion-systemic-risk-financial-crisis-lehman-brothers/
          </span>
        </a>
        “contagion” was the 
        <a
          href="https://www.wsj.com/articles/crypto-broker-voyager-digital-says-three-arrows-capital-hasnt-repaid-666-million-in-loans-11655915660"
          target="_blank"
          class="px-[10px] pt-[2px]  text-primary hover:bg-blue_1 tooltip"
        >
          <i class="iconoir-link inline-block" />
          <span class="tooltiptext text-body">
            https://www.wsj.com/articles/crypto-broker-voyager-digital-says-three-arrows-capital-hasnt-repaid-666-million-in-loans-11655915660
          </span>
        </a>
        collapse of Three Arrows Capital. Ongoing investigations are looking at whether 
        <a
          href="https://www.bloomyerg.com/news/articles/2022-06-22/voyager-discloses-660-million-exposure-to-troubled-crypto-fund"
          target="_blank"
          class="px-[10px] pt-[2px]  text-primary hover:bg-blue_1 tooltip"
        >
          <i class="iconoir-link inline-block" />
          <span class="tooltiptext text-body">
            https://www.bloomyerg.com/news/articles/2022-06-22/voyager-discloses-660-million-exposure-to-troubled-crypto-fund
          </span>
        </a>
        3AC took large margin longs on crypto through fraudulent activity and then  were 
        subsequently liquidated over the past month of pullbacks. Overall, it sounds 
        pretty bad for 3AC management and 
        <a
          href="https://twitter.com/MattWalshInBos/status/1540076849111465986"
          target="_blank"
          class="px-[10px] pt-[2px]  text-primary hover:bg-blue_1 tooltip"
        >
          <i class="iconoir-link inline-block" />
          <span class="tooltiptext text-body">
            https://twitter.com/MattWalshInBos/status/1540076849111465986
          </span>
        </a>
        they might be going to jail.
      </h6>
      <h6 class="text-justify leading-7 my-[20px] tracking-wide">
        The unifying thread of these major collapses was the concentration of digital 
        assets and their control into single points of failure. Even worse, the users 
        themselves were in the dark, unaware of what was occurring with little 
        visibility into the behind-the-scenes actions of those companies. What the 
        latest round of speculative growth in Web3 was built around was, in short, 
        unsustainable, over-leveraged, unregulated, wildcat banking, totally divorced 
        from the core ideas of a decentralized currency.
      </h6>
      <h6 class="text-justify leading-7 my-[20px] tracking-wide">
        Unfortunately, all of these problems were intentionally created 
        (not the fallout of course); many players in the Web3 ecosystem today 
        are attempting to rebuild traditional business models around SaaS and 
        fee extractional models by creating layers of complexity that separate users 
        from the core Web3 value proposition: Peer to Peer transactions.
      </h6>
      <h6 class="text-justify leading-7 my-[20px] tracking-wide">
        While the 2022 drawback in Web3 did a lot to refocus the industry on its 
        core principles, there are still growing centralization and regulatory concerns:
      </h6>
      <h5 class="text-[#d9d9d9] font-semibold my-[35px]">
        Ethereum Merge
      </h5>
      <h6 class="text-justify leading-7 my-[20px] tracking-wide">
        <a
          href="https://beaconcha.in/pools"
          target="_blank"
          class="px-[10px] pt-[2px]  text-primary hover:bg-blue_1 tooltip"
        >
          <i class="iconoir-link inline-block" />
          <span class="tooltiptext text-body">
            https://beaconcha.in/pools
          </span>
        </a>
        Ethereum 2.0 staking is currently heavily concentrated among major 
        cryptocurrency exchanges and the 
        <a
          href="https://lido.fi/"
          target="_blank"
          class="px-[10px] pt-[2px]  text-primary hover:bg-blue_1 tooltip"
        >
          <i class="iconoir-link inline-block" />
          <span class="tooltiptext text-body">
            https://lido.fi/
          </span>
        </a>
        Lido Pool. So far, just two centralized staking providers, 
        Coinbase and Lido, have mined almost 50% of 
        <a
          href="https://www.rated.network/?network=mainnet&view=entity"
          target="_blank"
          class="px-[10px] pt-[2px]  text-primary hover:bg-blue_1 tooltip"
        >
          <i class="iconoir-link inline-block" />
          <span class="tooltiptext text-body">
            https://www.rated.network/?network=mainnet&view=entity
          </span>
        </a>
        Ethereum blocks post merge. Control of cryptocurrencies by 
        “banks” (Coinbase, Kraken, BlockFi, FTX, etc)  presents a 
        threat to the uncensorable features of the Ethereum blockchain. 
        With control of the Ethereum blockchain and operating under 
        U.S. regulatory policies, these entities must implement any and 
        all controls as required by law. What this means is that 
        cryptocurrencies would effectively become fiat currencies - 
        implemented by decree from the state.
      </h6>
      <h6 class="text-justify leading-7 my-[20px] tracking-wide">
        If we are to avoid this scenario we must help create a truly 
        decentralized ecosystem where a few centralized entities 
        can’t control the Consensus mechanism of a Web3 protocol. 
        We need native Web3 solutions - peer to peer, decentralized 
        solutions and tools that empower the users, not centralized 
        market makers. We’re building Casimir to do just that.
      </h6>
      <h5 class="text-[#d9d9d9] font-semibold my-[35px]">
        Decentralization
      </h5>
      <h6 class="text-justify leading-7 my-[20px] tracking-wide">
        Probably the most overused and watered down word in the space 
        is decentralized. Everything in blockchain/web3 is called decentralized, 
        whether or not it actually is. The unfortunate reality is that 
        blockchains are decentralized in name only. 
        <a
          href="https://assets-global.website-files.com/5fd11235b3950c2c1a3b6df4/62af6c641a672b3329b9a480_Unintended_Centralities_in_Distributed_Ledgers.pdf"
          target="_blank"
          class="px-[10px] pt-[2px]  text-primary hover:bg-blue_1 tooltip"
        >
          <i class="iconoir-link inline-block" />
          <span class="tooltiptext text-body">
            https://assets-global.website-files.com/5fd11235b3950c2c1a3b6df4/62af6c641a672b3329b9a480_Unintended_Centralities_in_Distributed_Ledgers.pdf
          </span>
        </a>
        A recent study by Trail of Bits for DARPA concludes blockchains 
        are fairly centralized. They report that the pooled mining for 
        Bitcoin gives a Nakamoto coefficient of 4 to Bitcoin and Proof 
        of Stake protocols aren’t much better. I won’t get into criticism 
        of the overall piece by Trail of Bits, particularly the misassociation 
        of pools and protocol control for Bitcoin, but the Nakamoto Coefficient 
        for Proof of Stake is worth analyzing. Chris Remus of Chainflow has 
        written extensively on Staking Decentralization and currently maintains a 
        <a
          href="https://nakaflow.io/"
          target="_blank"
          class="px-[10px] pt-[2px]  text-primary hover:bg-blue_1 tooltip"
        >
          <i class="iconoir-link inline-block" />
          <span class="tooltiptext text-body">
            https://nakaflow.io/
          </span>
        </a>
        live Nakamoto Coefficient tracker that predates the Trail of Bits report. 
        The Nakamoto coefficient is a measure of decentralization and, 
        <a
          href="https://news.earn.com/quantifying-decentralization-e39db233c28e"
          target="_blank"
          class="px-[10px] pt-[2px]  text-primary hover:bg-blue_1 tooltip"
        >
          <i class="iconoir-link inline-block" />
          <span class="tooltiptext text-body">
            https://news.earn.com/quantifying-decentralization-e39db233c28e
          </span>
        </a>
        by definition, the numyer of nodes needed to control the Consensus mechanism 
        of the protocol. The lower the numyer, the less decentralized. At the time 
        of this writing, some major protocols have very low Nakamoto Coefficients, 
        of note Polygon is at 3.  
      </h6>
      <h6 class="text-justify leading-7 my-[20px] tracking-wide">
        The goal of Proof of Stake protocols should be to get the highest Nakamoto 
        Coefficient numyer possible, which would make it very difficult to manipulate 
        the protocol since it would require simultaneous compromisation of hundreds 
        of nodes. For example, Cosmos has an active set of validators of 150, 
        around the world. Compromising all of them would be likely impossible, 
        however the Nakamoto Coefficient of Cosmos, is only 7, meaning that to 
        control the Consensus mechanism of Cosmos would only take a compromise of 
        the top 7 Cosmos validators. A tough job to be sure, but a lot easier than 
        the 150 total active validators in the Cosmos ecosystem.
      </h6>
      <h6 class="text-justify leading-7 my-[20px] tracking-wide">
        What this means in practice is that the allocation of staked tokens should 
        be spread across all validators as equally as possible, not continually 
        concentrated in a few of the already heavily staked validators.
      </h6>
      <span
        class="text-body mt-[20px] leading-7 tracking-wide"
        :style="{
          'font-family': 'OpenSauceOneMedium'
        }"
      >
        
        So why are the Nakamoto coefficients so low? Let’s talk about the User Experience
      </span>
      <!-- add scalling image based on click or hover -->
      <div class="grid place-content-center">
        <img
          src="./components/current-web3-user-flow.png"
          alt="metamask-tweet"
          class="h-auto w-[400px] text-center"
        >
      </div>
      
      
      <h5 class="text-[#d9d9d9] font-semibold my-[35px]">
        User Experience
      </h5>
      <h6 class="text-justify leading-7 my-[20px] tracking-wide">
        The crypto user experience today… sucks. You’re forced to either leave 
        significant returns on the table and surrender control of your assets 
        to a major platform; or, endure the inconvenience of manually staking 
        across multiple protocols, wallets, platforms, and websites. It’s 
        harder to know what’s going on and it becomes easier to get scammed 
        through faulty smart contracts. The easiest way to manage multiple 
        crypto tokens and assets is through centralized exchanges like Coinbase, 
        which leave a lot to be desired. Not only are you not in true control 
        of your coins, if you’re staking, you’re missing out on potential 
        rewards that Coinbase scoops up for its bottom line. If you’re more 
        adventurous, you may have multiple wallets and multiple staking websites 
        you use. You have the benefits of self custody but are forced to go 
        through the process of managing the wide range of websites and wallets 
        you have to interact with the various protocols. It becomes confusing 
        to manage and monitor all of your stuff and there aren’t any good 
        solutions today that help you compile everything.
      </h6>
      <div class="grid grid-cols-2 csm:grid-cols-1 gap-margins">
        <h6 class="text-justify leading-7 my-[20px] tracking-wide col-span-1">
          What's more, current Web3 non-custodial products, like MetaMask, 
          fall far short of protecting users from scams or interacting with 
          bad smart contracts. Because cryptocurrencies are so difficult to 
          interact with and understand, even seasoned pros get manipulated and hacked.
        </h6>
        <div class="col-span-1 my-[20px] flex flex-col justify-center">
          <!-- add scalling image based on click or hover -->
          <img
            src="./components/metamask-tweet.png"
            alt="metamask-tweet"
          >
          <span
            class="text-caption mt-[20px]"
            :style="{
              'font-family': 'OpenSauceOneSemibold'
            }"
          >
            Metamask's respond...
          </span>
        </div>
      </div>
      
      <div class="grid grid-cols-2 csm:grid-cols-1 gap-margins">
        <div class="col-span-1  my-[20px] flex flex-col justify-center">
          <!-- add scalling image based on click or hover -->
          <img
            src="./components/cosmos-staking.png"
            alt="cosmos staking page"
          >
          <span
            class="text-caption mt-[10px]"
            :style="{
              'font-family': 'OpenSauceOneSemibold'
            }"
          >
            Cosmos's staking page.
          </span>
        </div>
        <h6 class="text-justify leading-7 my-[20px] tracking-wide col-span-1">
          Let’s look at how this poor user experience even affects the 
          Consensus mechanisms of PoS protocols. One of the easiest 
          ways to stake in the 
          <a
            href="https://wallet.keplr.app/#/cosmoshub/stake"
            target="_blank"
            class="px-[10px] pt-[2px]  text-primary hover:bg-blue_1 tooltip"
          >
            <i class="iconoir-link inline-block" />
            <span class="tooltiptext text-body">
              https://wallet.keplr.app/#/cosmoshub/stake
            </span>
          </a>
          Cosmos Ecosystem is using Keplr, a mobile/web wallet that 
          allows you to stake to any of the Tendermint based protocols. 
          However, users trying to stake with Keplr aren’t given 
          much to work with. 
        </h6>
      </div>
      <h6 class="text-justify leading-7 my-[20px] tracking-wide">
        A new Staker has no way of deciding who to stake to. 
        There are no easy ways of determining whether a listed 
        validator is reliable or participating in the governance 
        of a protocol. Users have no real reason to choose a validator 
        outside of the top ten, because there are no tools to sort 
        and research each individual validator. So people just pick 
        validators from the top of the list due to the appearance of 
        quality. We can see this effect through the Nakamoto 
        Coefficient of Cosmos today, which is 7. What’s more, two 
        of the top five Validators are cryptocurrency exchanges. In 
        Proof of Stake today, cryptocurrency exchanges have an outsized 
        impact on the consensus mechanism of proof of stake protocols.
      </h6>
      <h6 class="text-justify leading-7 my-[20px] tracking-wide">
        So, we’re left where we started. Exchanges offer the best user 
        experience and are gaining control over Proof of Stake protocols. 
        Since exchanges are likely to be regulated more like banks in the 
        future, we are looking at a future where Proof of Stake is 
        controlled by banks. What this means is that they control 
        consensus. They can censor accounts, users, or transactions 
        that they don’t like or are told to by the government. That’s a 
        fundamental threat to the idea of decentralization and cryptocurrency 
        as a whole - an uncensorable digital currency.
      </h6>
      <h6 class="text-justify leading-7 my-[20px] tracking-wide">
        We’re seeing that a poor user experience is driving centralization 
        and will continue to lead to major single point of failures like 
        Celsius unless we create tools that allow users to take full 
        advantage of the protocols they use.
      </h6>
      <h5 class="text-[#d9d9d9] font-semibold my-[35px]">
        How we're building Casimir
      </h5>
      <h6 class="text-justify leading-7 my-[20px] tracking-wide">
        First, we reexamined how Web3 and Crypto is being built today. 
        It’s been often stated that Web3 is “going to be just like the 
        internet”. It’s certainly true that there may be some parallels 
        in growth trajectory and societal impact; however, for many 
        projects in the space today, “just like the internet” means 
        being built using today’s internet: AWS/Google Cloud, numerous 
        HTML websites, and centralized SaaS powerhouses. With Casimir, 
        we want to break the paradigm of today’s Web3 and reexamine how 
        users interact with and use blockchains, cryptocurrencies, and Web3 overall.
      </h6>
      <h6 class="text-justify leading-7 my-[20px] tracking-wide">
        We are getting off the Web 2.0 rails and building something new, 
        a native web3 experience that prioritizes decentralization, user 
        experience, and user control. We’re building the first true Web3 
        portal, capable of integrating with any wallet, any blockchain, 
        and any token, allowing users to easily navigate Web3 and interact 
        with the protocols directly, not through a centralized exchange 
        or a variety of unconnected websites.
      </h6>
      <h5 class="text-[#d9d9d9] font-semibold my-[35px]">
        Improving the User Experience through Decentralization
      </h5>
      <div class="grid grid-cols-2 csm:grid-cols-1 gap-margins">
        <div class="my-[20px] col-span-1">
          <!-- add scalling image based on click or hover -->
          <img
            src="./components/casimir-user-flow.png"
            alt="cosmos staking page"
          >
        </div>
        <div class="my-[20px] col-span-1">
          <h6 class="text-justify leading-7  tracking-wide">
            We’re starting bottom up. Unlike current UIs, designed with 
            traditional Web2 architectures, we’re starting at the Consensus 
            and Infrastructure layers of Web3. These layers of decentralized 
            node infrastructure providers hold fully indexed blockchain 
            databases, provide APIs for querying, worldwide decentralized 
            nodes for consistent uptime, and process transactions as they 
            are added to the blockchain. 
          </h6>
        </div>
      </div>
      
      <h6 class="text-justify leading-7 my-[20px] tracking-wide">
        This won’t be a new protocol blockchain. A lot of the 
        interoperability efforts so far have just created yet another 
        blockchain, another website, another token, and another wallet. 
        The future of Web3 is a multichain experience and although bridges 
        have been a temporary fix to move between chains, they’ve become 
        too much of a risk and a better solution would be to create an 
        interface that allows users to seamlessly move between protocols 
        and wallets without having to 
      </h6>
      <h6 class="text-justify leading-7 my-[20px] tracking-wide">
        By accessing these nodes directly, users are assured of uptime, 
        uncensorable transactions, and can minimize fees taken by the normal 
        third party intermediaries. Also, users can access on-chain 
        analytics and information that these nodes carry as well as the 
        various smart contracts and tokens each protocol supports. 
      </h6>
      <h6 class="text-justify leading-7 my-[20px] tracking-wide">
        There are 3 key areas we’re focusing on as we design Casimir: 
        Transparency through Decentralization, Usability, and Security.
      </h6>
      <h6 class="text-justify leading-7 my-[20px] tracking-wide">
        Transparency through Decentralization: 
      </h6>
      <h6 class="text-justify leading-7 my-[20px] tracking-wide">
        Usability: Similar to a Mint or Personal Capital, it will be a 
        place where users can aggregate their digital currencies and 
        assets, for an easy place to manage what they have across the 
        various protocols they use. Most crypto users have multiple wallets 
        and assets from a variety of protocols, so a single location for 
        them to better manage and view their assets is much needed without 
        it being a single point of failure for any stakeholder. 
        Cross chain without the Bridge.
      </h6>
      <h6 class="text-justify leading-7 my-[20px] tracking-wide">
        Casimir will do more than just a Mint, however, it will allow 
        users to interact with their chosen protocols, accessing mints 
        and air-drops, Stake and manage their digital currencies across 
        protocols beyond ethereum, and access specialized tooling that 
        helps protect users. These user toolings are, frankly, things 
        that should already exist: 
      </h6>
      <h6 class="text-justify leading-7 my-[20px] tracking-wide">
        Security (non custodial, non tracking, analytics, on chain custody): 
        Smart contract analyzer for users to know what their interaction 
        with a smart contract will *actually* do and informs users of what 
        smart contracts they’ve given permissions to and enables them to 
        cancel those permissions on old contracts. Because we are working 
        at the protocol level, we are able to provide users with real time 
        information and on chain analytics to help users make the best 
        decisions with their digital assets.
      </h6>
      <h6 class="text-justify leading-7 my-[20px] tracking-wide">
        We eventually plan to launch a mobile/web wallet that will give 
        users full control over the assets from tokens to NFTs and beyond 
        for any major token protocol. This wallet will have intuitive 
        backups and protection for users while allowing them to easily 
        access the entire Web3 ecosystem.
      </h6>
    </div>
  </div>
</template>
