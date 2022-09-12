import { crawler, Chain } from '../src/index'

jest.setTimeout(20000)

test('get last block', async () => {
  const supercrawler = await crawler({
    chain: Chain.Iotex,
    verbose: true
  })

  expect(supercrawler.service).not.toBe(null)
  const lastBlock = await supercrawler.retrieveLastBlock()
  expect(typeof lastBlock).toBe('number')
})

// test('stream', async () => {
//   const supercrawler = await crawler({
//     chain: Chain.Iotex,
//     verbose: true
//   })
//
//   expect(supercrawler).not.toBe(null)
//   // supercrawler.on('block', (block) => {
//   //   console.log(block)
//   // })
// })
//
