import { GetCliInput } from '../interfaces/GetCliInput'
import { Dkg } from './dkg'
import { Ethdo } from './ethdo'

export function getCli(input: GetCliInput) {
    if (input.cliStrategy === 'dkg') {
        if (!input.messengerUrl) {
            throw new Error('No messenger url provided')
        }
        return new Dkg({
            cliPath: input.cliPath,
            messengerUrl: input.messengerUrl
        })
    }
    return new Ethdo({
        cliPath: input.cliPath
    })
}