import { ethers } from "ethers"

export interface Pool {
    id: number;
    balance: ethers.BigNumber;
    publicKey: string;
    operatorIds: number[];
    reshares: number;
    status: number;
}