const tap = require('tap')
const { crawler } = require('./dist/crawler.cjs')
const { newIotexService } = require('./dist/services/IotexService')

tap.test('iotex', async t => {
  const c = await crawler({ verbose: true })
  t.test('service', async (t) => {
    const service = await newIotexService()
    t.ok(service.endpoint)
  })

  t.test('status', async (t) => {
    t.same(c.running, false)
  })

  t.test('crawl blocks', async (t) => {
    await c.start()
    t.ok('ok')
  })
  t.end()
})
