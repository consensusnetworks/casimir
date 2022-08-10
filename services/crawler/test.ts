import test from 'ava';
import { crawler } from './src/Crawler';
import { newIotexService } from './src/services/IotexService';
import { CHAIN } from "./src/Crawler"

test('init Iotext service', async t => {
  const service = await newIotexService()
	t.truthy(service, 'service is not null')
});

test('init crawler', async t => {
  const testcrawler = await crawler({
    chain: CHAIN.Iotex,
    verbose: true
  })
  // await testcrawler.start()
  t.pass()
});