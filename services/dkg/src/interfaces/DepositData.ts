export interface DepositData {
    depositDataRoot: string;
    publicKey: string;
    signature: string;
    /** Contract address formatted as withdrawal credentials */
    withdrawalCredentials: string;
}