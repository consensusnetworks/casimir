import Transport from '@ledgerhq/hw-transport'

/**
 * Speculos TCP transport implementation
 *
 * @example
 * import SpeculosHttpTransport from "@casimir/hw-transport-speculos"
 * const transport = await SpeculosHttpTransport.open()
 * const res = await transport.send(0xE0, 0x01, 0, 0)
 */
export default class SpeculosHttpTransport extends Transport {
  baseURL: string
  eventStream!: EventSource

  constructor(baseURL: string) {
    super()
    this.baseURL = baseURL
  }

  static isSupported = (): Promise<boolean> => Promise.resolve(true)
  // this transport is not discoverable
  static list = (): Promise<never[]> => Promise.resolve([])
  static listen = () => ({
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    unsubscribe: () => {},
  })

  static open = async (
    baseURL?: string
  ): Promise<SpeculosHttpTransport> => {
    try {
      baseURL = baseURL || 'http://127.0.0.1:5001'
      const transport = new SpeculosHttpTransport(baseURL)
      const eventSource = new EventSource(`${baseURL}/events?stream=true`)
      // eventSource.addEventListener('open', (event: Event) => console.warn('Ledger', event.type), false)
      // eventSource.addEventListener('error', (event: Event) => console.warn('Ledger', event.type, eventSource.readyState), false)
      // eventSource.addEventListener('message', (message: MessageEvent) => console.warn('Ledger', message.type, message.data), false)
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
    await fetch(`${this.baseURL}/button/${but}`, { method: 'POST', body: JSON.stringify(action) })
  }

  async exchange(apdu: Buffer): Promise<any> {
    const hex = apdu.toString('hex')
    const response = await fetch(`${this.baseURL}/apdu`, { method: 'POST', body: JSON.stringify({ data: hex }) })
    // response is {"data": "hex value of response"}
    const data = (await response.json()).data
    return Buffer.from(data, 'hex')
  }

  async close() {
    // close event stream
    this.eventStream.close()
    return Promise.resolve()
  }
}
