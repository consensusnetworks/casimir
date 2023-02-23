import Transport from '@ledgerhq/hw-transport'
import TransportSpeculosHTTP from '@casimir/transport-speculos-http'
import TransportWebUSB from '@ledgerhq/hw-transport-webusb'

export default function useTransports() {

    async function createUSBTransport(): Promise<Transport> {
        return await TransportWebUSB.create()
    }

    async function createSpeculosTransport(baseURL?: string): Promise<Transport> {
        return await TransportSpeculosHTTP.open(baseURL)
    }

    return { createUSBTransport, createSpeculosTransport }
}