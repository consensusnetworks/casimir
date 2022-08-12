## Crawler

The crawler's purpose is to provide historical and real-time blockchain data to its consumers.


### Pre-requisites
// todo


## Usage
```js
const supercrawler = await crawler({
    chain: Chain.Iotex,
    verbose: true
})

// start
await supercrawler.start()

// subcribe to blocks
supercrawler.on('block', (block) => {
    console.log(blocks)
})

// stop
supercrawler.stop()