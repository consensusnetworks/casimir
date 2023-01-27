import { IValidator } from '@casimir/types'
import { IKeyGenOptions } from '../interfaces/IKeyGenOptions'
import SSV from './SSV'

export default class KeyGen {
    
    async createKeys (options: IKeyGenOptions): Promise<IValidator[]> {
        /** Default to ssv protocol */
        const ssv = new SSV()
        return await ssv.createKeys(options)
    }

}