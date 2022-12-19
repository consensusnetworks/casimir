<script lang="ts" setup>
  import ImgModal from './components/ImgModal.vue'
</script>

<template>
  <div class="py-margins">
    <div class="bg-blue_3 text-grey_1 py-gutter px-margins mb-margins">
      <p class="text-justify leading-6 tracking-wide">
        <span class="font-bold ">Note:</span>
        This started out as an internal document, reconfirming our 
        priorities and values as we watched the First Contagion, 
        the collapse of Luna, in early 2022. Today, we’re watching 
        the Second Contagion and the collapse of  one of the 
        overleveraged wildcat banks we allude to below. Although 
        we didn’t predict the collapse of FTX, nor are we trying 
        to predict what’s next, we continue to operate by our 
        principles first approach. This approach means working on 
        solutions for our core principles of self custody and 
        peer-to-peer transactions in the Web3 space. It’s why we 
        have never worked with or used FTX before and why our 
        current roadmap remains unchanged. What the FTX collapse 
        has done for us, though, is affirm our approach and hasten 
        our desire to bring about vast improvements to the UI/UX 
        problems that create a barrier to self custody for many users. 
        We hope the following will give insight as to why we’re taking 
        the approach we are and we hope you’ll join us on our journey 
        to making Web3 better, easier, and safer for all.
      </p>
    </div>
    <div class="px-margins">
      <h4 class="text-grey_2 font-bold my-[35px]">
        Why we're building Casimir
      </h4>
      <p class="text-justify leading-7 my-[20px] tracking-wide">
        It’s always a good idea to revisit your priorities and values 
        especially in this time of uncertainty in blockchain, cryptocurrency, 
        Web3, and technology at large. 
        <a
          href="https://blog.consensusnetworks.com/nist/"
          target="_blank"
          class="px-[10px] pt-[2px]  text-primary hover:bg-blue_1 tooltip"
        ><i class="iconoir-link inline-block" />
          <span class="tooltiptext text-body">https://blog.consensusnetworks.com/nist/</span>
        </a>
        We’ve written before about what the value proposition of blockchain 
        is and why we’re building technology as close to the consensus layer 
        as possible. Fundamentally, the consensus mechanism is what powers a 
        new medium; exchange of value without the need for a third party, 
        peer-to-peer transactions. It’s clear that many of the current 
        issues in the Web3 space today are due to egregious speculative 
        activity and attempted takeovers from centralized entities acting 
        far away from the consensus layer. 
      </p>
      <p class="text-justify leading-7 my-[20px] tracking-wide">
        We’ll briefly touch on some recent issues in Web3, the major reasons we think 
        they occurred, and why we’re building Casimir to help fix this.
      </p>

      <div class="grid grid-cols-2 csm:grid-cols-1 gap-margins">
        <div class="col-span-1 flex flex-col justify-between">
          <div>
            <h5 class="text-[#d9d9d9] font-semibold my-[35px]">
              Bridge Attacks
            </h5>

            <p class="text-justify leading-7 csm:mb-[20px] tracking-wide">
              In February 2022, the DeFi platform Wormhole was exploited for $325 million.
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
              Wormhole was a popular VC backed blockchain bridge designed to allow users 
              to access tokens across chains using a single access point. More recently 
              the Binance Smart Chain was exploited for $100M+. 
              <a
                href="https://decrypt.co/111433/binance-smart-chain-hack"
                target="_blank"
                class="px-[10px] pt-[2px]  text-primary hover:bg-blue_1 tooltip"
              >
                <i class="iconoir-link inline-block" />
                <span class="tooltiptext text-body">https://decrypt.co/111433/binance-smart-chain-hack</span>
              </a>
              While bridges are a potentially convenient solution to the mass of 
              protocols in existence, a single smart contract or hot wallet with $100M+ 
              of deposited tokens is proving to be too attractive of a target for hackers. 
              So far in 2022, over $2B worth of tokens on bridges have been hacked!
              <a
                href="https://www.forbes.com/sites/mariagraciasantillanalinares/2022/08/18/over-2-billion-stolen-this-year-in-blockchain-bridge-hacks-expose-defis-achilles-heel/?sh=39f74acbe50b"
                target="_blank"
                class="px-[10px] pt-[2px]  text-primary hover:bg-blue_1 tooltip"
              >
                <i class="iconoir-link inline-block" />
                <span class="tooltiptext text-body">
                  https://www.forbes.com/sites/mariagraciasantillanalinares/2022/08/18/over-2-billion-stolen-this-year-in-blockchain-bridge-hacks-expose-defis-achilles-heel/?sh=39f74acbe50b
                </span>
              </a>
            </p>
          </div>
          <div class=" w-full flex items-center justify-center p-gutter">
            <ImgModal 
              src="wormhole_twt.svg"
              alt="Wormhole's Annoucements"
              height="200px"
              width="100%"
            />
          </div>
          <div>
            <h5 class="text-[#d9d9d9] font-semibold my-[35px]">
              Decentralized in Name Only
            </h5>

            <p class="text-justify leading-7 my-[20px] tracking-wide">
              The first of the warning bells of the impending 2022 cryptocurrency 
              sell-off was the collapse of Terra. There are a range of reasons why 
              Terra collapsed but simply, algorithmic stable coins backed by digital 
              assets have fundamental challenges due to the volatile nature of digital 
              assets. 
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
              This early breakdown from Staking Rewards names a combination 
              of an overreliance on the yield platform Anchor combined with significant 
              off-chain usage on exchanges being a driving factor in the collapse 
              of Terra. Those externalities, controlled by central entities, 
              effectively subverted the consensus mechanism of the project by 
              operating off-chain where overleveraged risk could not be observed. 
              Additional issues were caused by a concentration of premined tokens 
              in the hands of Terraform Labs who essentially controlled protocol 
              voting and overrode the desires of some in the community to reduce risks. 
              A more recent postmortem in June 2022 showed that the liquidity issues 
              and subsequent depegging of the UST stable coin were caused by Terraform 
              Labs themselves.

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
            </p>
          </div>
        </div>
        <div class="col-span-1">
          <h5 class="text-[#d9d9d9] font-semibold my-[35px]">
            The Rise and Fall of CeDeFi
          </h5>

          <p class="text-justify leading-7 my-[20px] tracking-wide">
            Next to fall, and still unwinding, 
            <a
              href="https://www.wsj.com/articles/celsius-network-taps-more-advisers-to-prepare-for-potential-bankruptcy-11656088078"
              target="_blank"
              class="px-[10px] pt-[2px]  text-primary hover:bg-blue_1 tooltip"
            ><i class="iconoir-link inline-block" />
              <span class="tooltiptext text-body">
                https://www.wsj.com/articles/celsius-network-taps-more-advisers-to-prepare-for-potential-bankruptcy-11656088078
              </span>
            </a>
            is the “Centralized Decentralized Finance” (CeDeFi) company Celsius. 
            Companies like Celsius and BlockFi have driven huge growth in Web3 by 
            offering high interest rate yields on your deposited tokens. 
            They act as a bank but don’t do a good job of indicating the potential 
            risk their depositors face nor do they follow the same regulations 
            as traditional banks. Celsius was exposed to Terra 
            <a
              href="https://twitter.com/JackNiewold/status/1536402475418263554"
              target="_blank"
              class="px-[10px] pt-[2px]  text-primary hover:bg-blue_1 tooltip"
            ><i class="iconoir-link inline-block" />
              <span class="tooltiptext text-body">
                https://twitter.com/JackNiewold/status/1536402475418263554
              </span>
            </a>
            and potentially lost $500M there alone. More recent are revelations 
            that Celsius executives cashed out just prior to the collapse 
            <a
              href="https://www.forbes.com/sites/ninabambysheva/2022/10/06/celsius-executives-cashed-out-shortly-before-bankruptcy/?sh=565806bd31f7"
              target="_blank"
              class="px-[10px] pt-[2px]  text-primary hover:bg-blue_1 tooltip"
            ><i class="iconoir-link inline-block" />
              <span class="tooltiptext text-body">
                https://www.forbes.com/sites/ninabambysheva/2022/10/06/celsius-executives-cashed-out-shortly-before-bankruptcy/?sh=565806bd31f7
              </span>
            </a>
            and bankruptcy filing.
            <br> <br>
            Last of the “(first) contagion” 
            <a
              href="https://fortune.com/2022/05/12/crypto-crash-contagion-systemic-risk-financial-crisis-lehman-brothers/"
              target="_blank"
              class="px-[10px] pt-[2px]  text-primary hover:bg-blue_1 tooltip"
            ><i class="iconoir-link inline-block" />
              <span class="tooltiptext text-body">
                https://fortune.com/2022/05/12/crypto-crash-contagion-systemic-risk-financial-crisis-lehman-brothers/
              </span>
            </a>
            was the collapse of Three Arrows Capital. 
            <a
              href="https://www.wsj.com/articles/crypto-broker-voyager-digital-says-three-arrows-capital-hasnt-repaid-666-million-in-loans-11655915660"
              target="_blank"
              class="px-[10px] pt-[2px]  text-primary hover:bg-blue_1 tooltip"
            ><i class="iconoir-link inline-block" />
              <span class="tooltiptext text-body">
                https://www.wsj.com/articles/crypto-broker-voyager-digital-says-three-arrows-capital-hasnt-repaid-666-million-in-loans-11655915660
              </span>
            </a>
            Ongoing investigations are looking at whether 3AC took large margin 
            longs on cryptcurrencies 
            <a
              href="https://www.bloomberg.com/news/articles/2022-06-22/voyager-discloses-660-million-exposure-to-troubled-crypto-fund"
              target="_blank"
              class="px-[10px] pt-[2px]  text-primary hover:bg-blue_1 tooltip"
            ><i class="iconoir-link inline-block" />
              <span class="tooltiptext text-body">
                https://www.bloomberg.com/news/articles/2022-06-22/voyager-discloses-660-million-exposure-to-troubled-crypto-fund
              </span>
            </a>
            through fraudulent activity and then  were subsequently 
            liquidated over the past month of pullbacks. Overall, it sounds 
            pretty bad for 3AC management and they might be going to jail.
            <a
              href="https://twitter.com/MattWalshInBos/status/1540076849111465986"
              target="_blank"
              class="px-[10px] pt-[2px]  text-primary hover:bg-blue_1 tooltip"
            ><i class="iconoir-link inline-block" />
              <span class="tooltiptext text-body">
                https://twitter.com/MattWalshInBos/status/1540076849111465986
              </span>
            </a>
            <br><br>
            The unifying thread of these major collapses was the concentration of 
            digital assets and their control into single points of failure. Even worse, 
            the users themselves were in the dark, unaware of what was occurring with 
            little visibility into the behind-the-scenes actions of those companies. 
            What the latest round of speculative growth in Web3 was built around was, 
            in short, unsustainable, over-leveraged, unregulated, wildcat banking, 
            totally divorced from the core ideas of a decentralized currency. This 
            mentality has unfortunately not changed since the beginning of the year 
            and more liquidity crises are not out of the question.
            <br><br>
            Unfortunately, all of these problems were intentionally created 
            (not the fallout of course); many players in the Web3 ecosystem today 
            are attempting to rebuild traditional business models around SaaS and 
            fee extractional models by creating layers of complexity that separate 
            users from the core Web3 value proposition: Peer-to Peer-transactions.
            <br><br>
            While the 2022 drawback in Web3 did a lot to refocus the industry on its 
            core principles, there are still growing centralization and regulatory 
            concerns:
          </p>
        </div>
      </div>

      <h5 class="text-[#d9d9d9] font-semibold my-[35px]">
        Decentralization
      </h5>
      
      <p class="text-justify leading-7 my-[20px] tracking-wide">
        Probably the most overused and watered down word in the space is “decentralized.” 
        Nearly everything in blockchain/web3 is called decentralized, whether or not it 
        actually is. The unfortunate reality is that blockchains are decentralized in name only. 
        A recent study by Trail of Bits for DARPA 
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
        concludes blockchains are fairly centralized. They report that the pooled mining for 
        Bitcoin gives a Nakamoto coefficient of 4 to Bitcoin and Proof of Stake protocols aren’t 
        much better. I won’t get into criticism of the overall piece by Trail of Bits, particularly 
        the misassociation of pools and protocol control for Bitcoin, but the Nakamoto Coefficient 
        for Proof of Stake is worth analyzing. Chris Remus of Chainflow has written extensively 
        on Staking Decentralization and currently maintains a live Nakamoto Coefficient tracker 
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
        that predates the Trail of Bits report. The Nakamoto coefficient is a measure of 
        decentralization and, by definition, 
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
        the number of nodes needed to control the Consensus mechanism of the protocol. The lower 
        the number, the less decentralized. At the time of this writing, some major protocols have 
        very low Nakamoto Coefficients, of note Polygon is at 3.
        <br><br>
      </p>
      <div class="grid grid-cols-2 csm:grid-cols-1 gap-margins">
        <div class="flex flex-col justify-between col-span-1">
          The goal of Proof of Stake protocols should be to get the highest Nakamoto Coefficient 
          number possible, which would make it very difficult to manipulate the protocol since it
          would require simultaneous compromisation of hundreds of nodes. For example, Cosmos has an 
          active set of validators of 150, around the world. Compromising all of them would be 
          likely impossible, however the Nakamoto Coefficient of Cosmos, is only 7, meaning that to 
          control the Consensus mechanism of Cosmos would only take a compromise of the top 7 
          Cosmos validators. A tough job to be sure, but a lot easier than the 150 total active 
          validators in the Cosmos ecosystem.
          <br><br>
          What this means in practice is that the allocation of staked tokens should be spread across all validators as equally as possible, not continually concentrated in a few of the already heavily staked validators.
          <br><br>
          So why are the Nakamoto coefficients so low? Let’s talk about the User Experience
        </div>
        <div class="flex items-center">
          <ImgModal 
            src="current_bc_flow.svg"
            alt="Current flow"
            height="400px"
            width="65%"
          />
        </div>
      </div>
      <div class="grid grid-cols-8 csm:grid-cols-1 gap-margins my-[55px]">
        <div class="col-span-4 csm:col-span-1 h-[450px] flex items-center justify-center">
          <ImgModal 
            src="current-web3-user-flow.png"
            alt="Current Web 3 User Experience"
            height="400px"
            width="90%"
          />
        </div>
        <div class="col-span-4 flex flex-col justify-between">
          <div>
            <h5 class="text-[#d9d9d9] font-semibold mb-[35px]">
              User experience
            </h5>

            <p class="text-justify leading-7 mt-[20px] tracking-wide">
              The Web3 user experience today… sucks. You’re forced to either leave 
              significant returns on the table and surrender control of your assets 
              to a major exchange; or, endure the inconvenience of manually staking 
              across multiple protocols, wallets, platforms, and websites. It’s harder 
              to know what’s going on and it becomes easier to get scammed through 
              faulty or malicious smart contracts. 
            </p>  
          </div>
          <div>
            <p class="text-justify items-center text-grey_4 leading-7 mt-[20px] flex flex-wrap gap-0 justify-between">
              <span class="whitespace-nowrap">What Web3 looks like today</span> 
              <span class="invisible csm:visible">[Above]</span>
              <span class="visible csm:invisible">[Side]</span> 
            </p>  
          </div>
        </div>
      </div>

      <p class="text-justify leading-7 mt-[20px] tracking-wide">
        The easiest way to manage multiple digital tokens and assets is through centralized 
        exchanges like Coinbase, which leave a lot to be desired. You give up custody of 
        your tokens and if you’re staking, you’re missing out on potential rewards that 
        Coinbase scoops up in the form of third party fees. If you’re more adventurous, 
        you may have multiple wallets and multiple staking websites you use. You have the 
        benefits of self custody but are forced to go through the process of managing the 
        wide range of websites and wallets you have to interact with the various protocols. 
        It becomes confusing to manage and monitor all of your stuff and there aren’t any 
        good solutions today that help you compile everything.
      </p>
      <div class="my-margins flex justify-center border border-dashed border-blue_3 border-[2px] p-margins relative">
        <div class="floating_pill">
          Metamask's Responds with a tweet...
        </div>
        <ImgModal 
          src="metamask-tweet.png"
          alt="Metamask's Tweet"
          height="150px"
          width="80%"
        />
      </div>

      <p class="text-justify leading-7 mt-[20px] tracking-wide">
        What's more, current Web3 non-custodial products, like MetaMask, fall far short 
        of protecting users from scams or interacting with bad smart contracts. Because 
        cryptocurrencies are so difficult to interact with and understand, even seasoned 
        pros get manipulated and hacked.
        <br><br>
        Let’s look at how this poor user experience even affects the Consensus mechanisms 
        of PoS protocols. One of the easiest ways to stake in the Cosmos Ecosystem is using Keplr, 
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
        a mobile/web wallet that allows you to stake to any of the Tendermint based protocols. 
        However, users trying to stake with Keplr aren’t given much to work with. 
        <a
          href="https://wallet.keplr.app/chains/cosmos-hub"
          target="_blank"
        >
          <div class="w-min flex items-center mt-margins mb-gutter">
            <div class="bg-blue_3 h-full w-full px-gutter py-[6px] whitespace-nowrap">
              <h6 class="font-bold text-white">
                Let’s view one example: Cosmos Staking Page
              </h6> 
            </div>
            <div class="triangle" />
          </div>
        </a>
        A new Staker has no way of deciding who to stake to. There are no easy ways of determining 
        whether an above listed validator is reliable or participating in the governance of a protocol.
        Users have no real reason to choose a validator outside of the top ten, because there are 
        no tools to sort and research each individual validator. So, people end up picking 
        validators from the top of the list due to the appearance of quality. We can see this 
        effect in the Nakamoto Coefficient of Cosmos today, which is 7. What’s more, two of 
        the top five Validators for Cosmos are cryptocurrency exchanges. In Proof of Stake today, 
        cryptocurrency exchanges have an outsized impact on the consensus mechanism of proof of 
        stake protocols.
        <br><br>
        So, we’re left where we started. Exchanges offer the best user experience and are gaining 
        control over Proof of Stake protocols. Since exchanges are likely to be regulated more like 
        banks in the future, we are looking at a future where Proof of Stake is controlled by banks. 
        What this means is that they control consensus. They can censor accounts, users, or 
        transactions that they don’t like or are told to by the government. That’s a fundamental 
        threat to the idea of decentralization and Web3 as a whole - an uncensorable digital currency.
        <br><br>
        Our conclusion is that a poor user experience is driving centralization and will continue to 
        lead to major single point of failures like Celsius unless we create tools that allow users 
        to take full advantage of the protocols they use.
      </p>
      <hr class="mt-margins bg-blue_3 h-[20px]">
      <h5 class="text-[#d9d9d9] font-semibold mb-[35px] mt-margins">
        How we’re building Casimir
      </h5>
      <div class="grid grid-cols-8 csm:grid-cols-1 gap-margins my-[55px]">
        <p class="text-justify leading-7 mt-[20px] tracking-wide col-span-5 csm:col-span-1">
          First, we reexamined how Web3 is being built today. It’s been often stated that Web3 
          is “going to be just like the internet”. It’s certainly true that there may be some 
          parallels in growth trajectory and societal impact; however, for many projects in 
          the space today, “just like the internet” means being built using today’s internet: 
          AWS/Google Cloud, numerous HTML websites, and centralized SaaS powerhouses.
          With Casimir, we want to break the paradigm of today’s Web3 and reexamine 
          how users interact with and use blockchains, digital value, and Web3 overall.
          <br><br>
          We are getting off the Web 2.0 rails and building something new, a native Web3 
          experience that prioritizes decentralization, user experience, and user control. 
          We’re building the first true Web3 portal, capable of integrating with any wallet, 
          any blockchain, and any token, allowing users to easily navigate Web3 and interact 
          with the protocols directly, not through a centralized exchange or a variety of 
          unconnected websites.
        </p>
        <div class="col-span-3 csm:col-span-1 flex flex-col items-center">
          <ImgModal 
            src="current-web3-user-flow.png"
            alt="Current Web 3 User Experience"
            height="350px"
            width="100%"
          />
          <span class="text-grey_4">
            Casimir's Design
          </span>
        </div>
      </div>
      <h5 class="text-[#d9d9d9] font-semibold mb-[35px] mt-margins">
        Improving the User Experience through Decentralization
      </h5>
      <p class="text-justify leading-7 mt-[20px] tracking-wide">
        We’re starting bottom up. Unlike current UIs, designed with traditional Web2 architectures, 
        we’re starting at the Consensus and Infrastructure layers of Web3. These layers of 
        decentralized node infrastructure providers hold fully indexed blockchain databases, 
        provide APIs for querying, a network of worldwide decentralized nodes for consistent 
        uptime, and build blocks of transactions as they are added to the blockchain. Today, 
        most users are forced through third parties to access blockchains, which introduces 
        extra costs for transactions and token management. By accessing these nodes directly, 
        users are assured of uptime, uncensorable and low cost transactions, and minimized fees 
        taken by the normal third party intermediaries. Also, with the right tools, 
        users can access on-chain analytics and other information that these nodes carry. 
        This information can protect users by providing transparency to the entities they’re 
        interacting with as well as information about smart contracts and other on-chain data. 
        Today there simply aren’t good enough tools to make on-chain information available and 
        usable to the everyday user.
        <br><br>
        There are 3 key areas we’re focusing on as we design Casimir: Usability, Security, and 
        Transparency.
      </p>

      <h5 class="text-[#d9d9d9] font-semibold mb-[35px] mt-margins">
        Usability
      </h5>

      <div class="text-justify leading-7 mt-[20px] tracking-wide grid grid-cols-8 csm:grid-cols-1 gap-margins">
        <p class="col-span-3 csm:col-span-1">
          Similar to a Mint or Personal Capital, it will be a place where users can aggregate 
          their digital currencies and assets, for an easy place to manage what they have across 
          the various protocols they use. Many Web3 users have multiple wallets and assets from 
          a variety of protocols, so a single location for them to better manage and view their 
          assets is much needed without it being a single point of failure for any stakeholder.  
          With our multi-chain approach and Multiwallet Connect we can effectively be an 
          interoperability solution without the bridge.  
        </p>
        <div class="col-span-5 csm:col-span-1 flex flex-col justify-between">
          <p>
            Casimir will do more than just a Mint, however, it will allow users to interact with 
            their chosen protocols, accessing mints and air-drops, Stake and manage their digital 
            currencies across protocols beyond ethereum, and access specialized tooling that 
            helps protect users. We’ll build and continue to add features like this that help 
            users use Web3.  
          </p>
          <p>
            Our business model isn’t built around trading or exchange fees. Unlike an exchange, 
            we’re not front running trades or building in hidden custodial fees. Our base product 
            will always be free to use and we’ll make money by offering a premium subscriber 
            product as well as through our infrastructure services. We believe you’ll not only 
            have a better user experience, but you’ll actually save money as well.  
          </p>
        </div>
      </div>

      <h5 class="text-[#d9d9d9] font-semibold mb-[35px] mt-margins">
        Security
      </h5>
      
      <div class="text-justify leading-7 mt-[20px] tracking-wide grid grid-cols-8 csm:grid-cols-1 gap-margins">
        <p class="col-span-3 csm:col-span-1">
          Unlike most centralized exchanges and custodians, we will never take custody of user’s 
          wallets or tokens. This means we are able to leverage existing on-chain security to 
          protect users at a much higher level. It also means we will never be worried about 
          liquidity or will be trading a user's tokens on the backend. Although Casimir will 
          be a single site, it won’t be a single point of failure. The code is open source and 
          we will never take custody of user’s digital tokens or NFTs. If Casimir goes away 
          tomorrow, no funds will disappear and users will still have access to all of their tokens. 
        </p>
        <div class="col-span-5 csm:col-span-1 flex flex-col justify-between">
          <p>
            Unlike traditional Web2, we’re not building around user account management, user 
            analytics, and productizing the user. We’ll never ask for a user's email address 
            and build an internal profile because not only does this create a security vulnerability 
            for our users, it’s also unnecessary. Our users will always be able to login through 
            their wallet which means they will always control their login credentials.
          </p>
          <p>
            As part of our usability effort we’re building a smart contract analyzer for users 
            to know what their interaction with a smart contract will *actually* do and monitor 
            the smart contracts they’ve given permissions to and control permissions on old 
            contracts. Because we are working at the protocol level, we are able to provide 
            users with real time information and on chain analytics to help users make the 
            best decisions with their digital assets.
          </p>
        </div>
      </div>

      <h5 class="text-[#d9d9d9] font-semibold mb-[35px] mt-margins">
        Transparency
      </h5>
      
      <div class="text-justify leading-7 mt-[20px] tracking-wide grid grid-cols-8 csm:grid-cols-1 gap-margins">
        <p class="col-span-3 csm:col-span-1">
          As the name indicates, every on chain action on a public blockchain is publicly accessible. 
          Every wallet, every transaction. This transparency is unique in financial systems where 
          the books of banks or governments are not available to everyday users. Today, many Web3 
          financial providers continue to hide behind their proprietary systems and their financial 
          solvency is only available to the select. What’s worse is that these companies 
          (in the US at least) often skirt regulation loopholes to avoid the same auditory 
          requirements banks have. 
          <br><br>
          In a world where Bitcoin was launched in the face of a banking crisis, with a desire to 
          bring about a new and transparent financial system to the world, the actions of many 
          major players in the space today are in direct opposition to the values of Web3.
        </p>
        <div class="col-span-5 csm:col-span-1 flex flex-col justify-between">
          <p>
            Casimir will help change this. We leverage our fully indexed chains to provide 
            transparency analytics to our users. While block explorers and address balances 
            are always available to those who know how and where to look, we’re making it 
            easier for users to interact with and use Web3 indexed information. We’ll allow 
            users to easily sort data, see large and identified wallets, track large transactions, 
            and match wallets with organizations so that proof of reserves can be ensured.
          </p>
          <p>
            We’re here to create a better Web3 user experience. For us that means enabling users 
            to better use the decentralized capabilities of the space, not to trade better in the 
            crypto casino. We’ve got a long way ahead of us, both to build something better but 
            also to help users learn the importance of self-custody and what decentralization truly means. 
          </p>
          <p>
            Over the next few months we’ll present some of the specific technology developments 
            we’re working on to help achieve our goals including non-custodial Ethereum Staking, 
            cross-chain wallet integrations, and a cross-chain single sign on. You can follow our 
            progress on github 
            <a
              href="https://github.com/consensusnetworks/casimir"
              target="_blank"
              class="px-[10px] pt-[2px]  text-primary hover:bg-blue_1 tooltip"
            >
              <i class="iconoir-link inline-block" />
              <span class="tooltiptext text-body">
                https://github.com/consensusnetworks/casimir
              </span>
            </a>
            and join us on Discord. 
            <a
              href="https://discord.com/invite/Vy2b3gSZx8"
              target="_blank"
              class="px-[10px] pt-[2px]  text-primary hover:bg-blue_1 tooltip"
            >
              <i class="iconoir-link inline-block" />
              <span class="tooltiptext text-body">
                https://discord.com/invite/Vy2b3gSZx8
              </span>
            </a>
            We’re striving to create an open ecosystem 
            that empowers the user and we hope you’ll join us.
          </p>
        </div>
      </div>

      <div class="my-margins flex justify-between flex-wrap gap-gutter border border-dashed border-blue_3 border-[2px] p-margins relative">
        <div class="floating_pill">
          Who are we building Casimir for?
        </div>
        <div class="w-3/8 min-w-min flex items-center">
          <h5 class="font-black">
            Cryptocurrency enthusiast
          </h5>
        </div>
        <div class="w-3/8 min-w-min flex items-center">
          <h5 class="font-black">
            &
          </h5>
        </div>
        <div class="w-4/8 min-w-min flex gap-gutter flex-wrap items-center">
          <h5 class="font-black text-left">
            Disatvantaged people by egregious policies
          </h5>
        </div>
      </div>

      <hr class="mt-margins bg-blue_3 h-[20px]">

      <h5 class="text-[#d9d9d9] font-semibold mb-[35px] mt-margins">
        Our Vision
      </h5>

      <p class="text-justify leading-7 mt-[20px] tracking-wide">
        - We need robust tools for the user experience, to help them maintain 
        their own custody and avoid scams. We have the capabilities to scan 
        smart contracts and understand what wallets bad actors use. The 
        openness of blockchain protocols should provide the information 
        needed to protect users, however it's not being put to use.
        <br><br>
        - Users need easy but secure ways to back up their keys.
        <br><br>
        - Users need to be able to access multiple tokens, NFTs, and other 
        assets without being forced to use a centralized and vulnerable bridge.
        <br><br>
        - Users shouldn’t struggle to find easy tools outside of Cryptocurrency 
        Exchanges, self custody should be the first option, not second.
        <br><br>
        - It’s with this in mind that we set out to build Casimir. 
      </p>

      <h5 class="text-[#d9d9d9] font-semibold mb-[35px] mt-margins">
        Our Future
      </h5>
      <p class="text-justify leading-7 mt-[20px] mb-[60px] tracking-wide">
        - We need to solve the basic problems and build a strong foundation to 
        realize the promises of crypto from Real World Asset Tokenization to the Metaverse.
        <br><br>
        - We won’t be building a new protocol blockchain. A lot of interoperability 
        efforts so far have created yet another blockchain, another website, 
        another token, and another wallet. The future of Web3 is a multichain 
        experience and although bridges have been a temporary fix to move between 
        chains, they’ve become too much of a risk and a better solution would be 
        to create an interface that allows users to seamlessly move between protocols 
        and wallets without having to 
        <br><br>
        - Already, these major players are censoring certain addresses associated with 
        the Tornado Cash shutdown. While Tornado Cash was associated with North 
        Korean hackers and the desire of US government to shutdown its operation 
        seems justified, actual regulatory policy regarding sanction criteria is 
        forthcoming. What’s more is the indication of major players like Coinbase 
        intend to operate just as traditional banks, raising the question of what’s 
        the actual value proposition of cryptocurrencies? Do they become simply a 
        highly traceable digital cash where governments are able to shutdown users' 
        ability to transact unitarily without any due process a la CBDCs in China? 
        <br><br>
        - We eventually plan to launch a mobile/web wallet that will give users full 
        control over the assets from tokens to NFTs and beyond for any major token 
        protocol. This wallet will have intuitive backups and protection for users 
        while allowing them to easily access the entire Web3 ecosystem.
      </p>
    </div>
  </div>
</template>
