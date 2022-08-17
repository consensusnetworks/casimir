import { crawler, Chain } from '../src/index'

// test('init crawler', async () => {
//   const supercrawler = await crawler({
//     chain: Chain.Iotex,
//     verbose: true
//   })
//   // await supercrawler.start()
//   supercrawler.on('block', b => {
//     console.log(b)
//   })
//   expect(supercrawler.service).not.toBe(null)
// })