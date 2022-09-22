import { crawler } from '../src/index'
import { Chain } from '../src/providers/Base'
import {queryAthena} from '@casimir/helpers'

jest.setTimeout(20000)

test('init crawler for iotex', async () => {
  const iotex = await crawler({
    chain: Chain.Iotex,
    verbose: true
  })
  expect(iotex.service).not.toBe(null)
})
//
// test('start crawler for iotex', async () => {
//   const iotex = await crawler({
//     chain: Chain.Iotex,
//     verbose: true
//   })
//
//   await iotex.start()
//   // expect(iotex.service).not.toBe(null)
// })

test('init crawler for ethereum', async () => {
  const eth = await crawler({
    chain: Chain.Ethereum,
    verbose: true
  })

  expect(eth.service).not.toBe(null)
})


test('init crawler for ethereum', async () => {
  const queryResult = await queryAthena('SELECT * FROM "casimir_etl_database_dev"."casimir_etl_event_table_dev" where chain = \'iotex\' limit 10')
  expect(queryResult.length).toBe(10)
})




// test('get last block', async () => {
//   const supercrawler = await crawler({
//     chain: Chain.Iotex,
//     verbose: true
//   })
//
//   expect(supercrawler.service).not.toBe(null)
//   const lastBlock = await supercrawler.retrieveLastBlock()
//   expect(typeof lastBlock).toBe('number')
// })

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
