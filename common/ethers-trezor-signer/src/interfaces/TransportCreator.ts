import Transport from '@ledgerhq/hw-transport'


export interface TransportCreator {
    create: () => Promise<Transport>
}