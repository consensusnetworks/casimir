# @casimir/dkg

Trustless DKG oracle service

## About

The DKG oracle service is run by DAO members to trigger and prove distributed key operations. It is a [NodeJS](https://nodejs.org) application that runs either a leader oracle capable of running a [RockX distributed key generation (DKG) CLI and messenger server](https://github.com/rockx/rockx-dkg-cli), or a follower oracle that monitors leader operations, publishes proofs, and helps to elect a new leader if necessary.

The nature and location of DKG proofs is a WIP depending on [DKG verification](https://docs.obol.tech/docs/next/charon/dkg#dkg-verification) research.

Critical portions of the oracle service code can be deployed to a secure enclave (like an AMD TrustZone on an [AMD EPYC 7002](https://www.amd.com/en/products/epyc-7002-series-processors)) to improve the integrity and security of computation and memory. Google Cloud uses this technology to provide its flagship confidential compute product, and Chainlink uses it to build more tamper-resistant oracle nodes.

### Malicious Operator Defense

If a consensus threshold of node operators do not respond to a reshare or exit signature request, the DAO has a few options:

- Store encrypted backups of presigned exit messages, and have the leader decrypt and submit them as needed (with DAO approval)
- Have the leader call a contract-native validator exit (with DAO approval)

> 🚩 The latter is the most secure option, but requires a WIP EIP to be implemented

### Malicious Leader Defense

A theshold signature of the DAO oracles can elect a new leader as needed, by emitting a contract event monitored by node operators, so the leader can be swiftly replaced if it is at risk of compromise, or simply fails.

### Future

In the future, some aspects of this DAO oracle network may be improved, or become obsolete, as the underlying decentralized protocols evolve:

- SSV contract-native, zero-coordination key operation triggers (with SSV DKG support) may augment or replace the DKG messenger server and the need for a leader oracle service
- Contract-native validator exit triggers may remove the need for presigned validator exit messages

Eventually, the DAO responsibility may be reduceable to an entity providing voting-mechanisms for owners (stakers, operators, and DAO members) to vote on contract changes alongside underlying protocol updates.

## Development

Todo.
