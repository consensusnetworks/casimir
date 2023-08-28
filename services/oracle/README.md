# @casimir/oracle

Casimir DAO oracle service

## About

The DAO oracle service initiates and reports on validator operations: distributed key generation (DKG) ceremonies, DKG reshares, and DKG or presigned exit requests. It contains a [NodeJS](https://nodejs.org) application that listens for `DepositRequested`, `ReshareRequested`, and `ExitRequested` events, which then internally uses the [RockX DKG CLI and messenger server](https://github.com/rockx/rockx-dkg-cli) to initiate and retrieve operator group DKG results. The `DepositRequested` event starts a new DKG keygen and retrieves the results to submit a new validator via `depositPool`. The `ReshareRequested` event starts a new DKG reshare and retrieves the results to update an existing validator via `resharePool`. The `ExitRequested` event starts a new DKG exit and retrieves the results to submit a signed exit message directly to the Beacon chain.

DKG operations and reports will theoretically have [verifiable](https://docs.obol.tech/docs/next/charon/dkg#dkg-verification) aspects that prove fair DKG ceremonies.

> 🚩 The deployment strategy, including the API security, of this service is a WIP, and will be done in a way that allows for easy upgrades and/or replacement with a contract-native DKG trigger mechanism. Casimir is researching the best approach to trustless operations in collaboration with Chainlink, SSV, and RockX, and the @casimir/oracle service will prioritize a combination of security and decentralization as much as possible.

### Future

In the future, some aspects of this oracle service may be improved, or become obsolete, as the underlying decentralized protocols evolve:

- SSV contract-native, zero-coordination key operation triggers (with SSV DKG support) may augment or replace the DKG messenger server and the need for a single-instance oracle service
- Contract-native validator exit triggers may remove the need for presigned validator exit messages
