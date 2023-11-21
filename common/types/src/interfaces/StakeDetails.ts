export interface StakeDetails {
    operatorType: "Default" | "Eigen",
    address: string,
    amountStaked: number,
    availableToWithdraw: number
}