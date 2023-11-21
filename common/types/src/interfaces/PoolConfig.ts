import { ethers } from "ethers"

export interface PoolConfig {
    poolAddress: string;
    balance: ethers.BigNumber;
    operatorIds: number[];
    publicKey: string;
    reshares: number;
    status: number;
}