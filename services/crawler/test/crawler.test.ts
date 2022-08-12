import { crawler, Chain } from '../src/index';

test('init crawler', async () => {
  const supercrawler = await crawler({
    chain: Chain.Iotex,
    verbose: true
  })
  // await testcrawler.start()
  // supercrawler.on("block", block => {
  //   console.log(block)
  // })
  expect(supercrawler.service).not.toBe(null)
});