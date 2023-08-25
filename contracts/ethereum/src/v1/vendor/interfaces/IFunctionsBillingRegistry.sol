// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

interface IFunctionsBillingRegistry {
    function createSubscription() external returns (uint64);
    function addConsumer(uint64 subscriptionId, address consumer) external;
    function cancelSubscription(uint64 subscriptionId, address receiver) external;
}
