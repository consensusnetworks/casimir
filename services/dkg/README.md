# @casimir/dkg

Casimir DKG oracle service

## About

The distributed key generation (DKG) oracle is initially intended to be a single-instance service used to initiate, publish, and prove fair distributed key operations. It contains a [NodeJS](https://nodejs.org) application that listens for `PoolDepositRequested`, `PoolReshareRequested`, and `PoolExitRequested` events, which then internally uses the [RockX DKG CLI and messenger server](https://github.com/rockx/rockx-dkg-cli) to initiate and retrieve operator group DKG results. The `PoolDepositRequested` event starts a new DKG keygen and retrieves the results to submit a new validator via `initiatePoolDeposit`. The `PoolReshareRequested` event starts a new DKG reshare and retrieves the results to update an existing validator via `resharePool`. The `PoolExitRequested` event starts a new DKG exit and retrieves the results to submit a signed exit message directly to the Beacon chain.

The DKG operations will have verifiable aspects that can eventually be used in proofs. The "what" and "where" of these proofs is a WIP depending on continued [DKG verification](https://docs.obol.tech/docs/next/charon/dkg#dkg-verification) research.

> 🚩 The deployment strategy, including the API security, of this service is a WIP, and will be done in a way that allows for easy upgrades and/or replacement with a contract-native DKG trigger mechanism. Casimir is researching the best approach to trustless operations in collaboration with Chainlink, SSV, and RockX, and the @casimir/dkg service will prioritize a combination of security and decentralization as much as possible.

### Future

In the future, some aspects of this oracle service may be improved, or become obsolete, as the underlying decentralized protocols evolve:

- SSV contract-native, zero-coordination key operation triggers (with SSV DKG support) may augment or replace the DKG messenger server and the need for a single-instance oracle service
- Contract-native validator exit triggers may remove the need for presigned validator exit messages
