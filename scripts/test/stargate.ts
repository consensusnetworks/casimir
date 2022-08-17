import { StargateClient } from '@cosmjs/stargate'
;(async () => {
  const client = await StargateClient.connect('https://rpc-cosmoshub.keplr.app')
  console.log('client :>> ', client.getChainId())
})()

// SE: Can you expand your terminal? Like make it taller
// CC: How's that?
// SE: I can't see it well for some reason
// CC: Want to do share screen?
