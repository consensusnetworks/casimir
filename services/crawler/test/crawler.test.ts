import { crawler } from '../src/Crawler';
import { Chain } from "../src/Crawler"

test('init crawler', async () => {
  const testcrawler = await crawler({
    chain: Chain.Iotex,
    verbose: true
  })
  expect(testcrawler.service).not.toBe(null)
});