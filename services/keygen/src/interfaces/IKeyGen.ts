import { IValidator } from '@casimir/types'

export interface IKeyGen {
    /** 
     * Generate keys in groups for specified eligible operators 
     * 
     * @param operatorIds - All eligible operators
     * @returns Promise of the resulting validator keys
     */
    generateKeys(operatorIds: number[]): Promise<IValidator[]>
}