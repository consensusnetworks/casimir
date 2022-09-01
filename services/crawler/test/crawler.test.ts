import { crawler, Chain } from '../src/index'

jest.setTimeout(20000)

test('init crawler', async () => {
  const supercrawler = await crawler({
    chain: Chain.Iotex,
    verbose: true
  })
  // await supercrawler.start()
  expect(supercrawler.service).not.toBe(null)
})

test('stream', async () => {
  const supercrawler = await crawler({
    chain: Chain.Iotex,
    verbose: true
  })
  expect(supercrawler).not.toBe(null)
})

