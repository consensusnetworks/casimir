import { DisconnectedDevice } from '@ledgerhq/errors'
import Transport from '@ledgerhq/hw-transport'
import { log } from '@ledgerhq/logs'

export type SpeculosHttpTransportOpts = {
  baseURL?: string;
  timeout?: number;
};

/**
 * Speculos TCP transport implementation
 *
 * @example
 * import SpeculosHttpTransport from "@casimir/hw-transport-speculos"
 * const transport = await SpeculosHttpTransport.open()
 * const res = await transport.send(0xE0, 0x01, 0, 0)
 */
export default class SpeculosHttpTransport extends Transport {
  opts: SpeculosHttpTransportOpts
  eventStream!: EventSource

  constructor(opts: SpeculosHttpTransportOpts) {
    super()
    this.opts = opts
  }

  static isSupported = (): Promise<boolean> => Promise.resolve(true)
  // this transport is not discoverable
  static list = (): Promise<never[]> => Promise.resolve([])
  static listen = () => ({
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    unsubscribe: () => {},
  })

  static open = async (
    opts?: SpeculosHttpTransportOpts
  ): Promise<SpeculosHttpTransport> => {
    try {
      opts = opts || { baseURL: 'http://127.0.0.1:5001' }
      const transport = new SpeculosHttpTransport(opts)
      const eventSource = new EventSource(`${opts.baseURL}/events?stream=true`)
      eventSource.addEventListener('data', (event) => {
        console.log(event.data)
      })
      eventSource.addEventListener('close', (event) => {
        console.log(event.data)
      })
      transport.eventStream = eventSource
      return transport
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  /**
   * Press and release button
   * buttons available: left, right, both
   * @param {*} but
   */
  button = async (but: string): Promise<void> => {
    const action = { action: 'press-and-release' }
    log('speculos-button', 'press-and-release', but)
    await fetch(`${this.opts.baseURL}/button/${but}`, { method: 'POST', body: JSON.stringify(action) })
  }

  async exchange(apdu: Buffer): Promise<any> {
    const hex = apdu.toString('hex')
    log('apdu', '=> ' + hex)
    const response = await fetch(`${this.opts.baseURL}/apdu`, { method: 'POST', body: JSON.stringify({ data: hex }) })
    // response is {"data": "hex value of response"}
    const data = (await response.json()).data
    log('apdu', '<= ' + data)
    return Buffer.from(data, 'hex')
  }

  async close() {
    // close event stream
    this.eventStream.close()
    return Promise.resolve()
  }
}
