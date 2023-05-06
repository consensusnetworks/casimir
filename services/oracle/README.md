# @casimir/oracle

DAO oracle service equipped with [@casimir/keys](../keys/README.md)

## About

The DAO oracle service is a [NodeJS](https://nodejs.org) application that runs a tamper-resistant oracle capable of running a [RockX distributed key generation (DKG) CLI and messenger server](https://github.com/rockx/rockx-dkg-cli) to trigger distributed key operations for Casimir validators in a trustless fashion. The oracle service code is designed to be deployed to an AMD TrustZone secure enclave (using an [AMD EPYC 7002](https://www.amd.com/en/products/epyc-7002-series-processors)) to protect the integrity and security of computation and memory (Google Cloud uses this technology to provide its flagship confidential compute product). The oracle service also watches, and is watched by, the other DAO member oracle service instances. One leader oracle service is elected to trigger key operations as needed, and the other oracle services provide tamper detection, security monitoring, and vulernability reports. The oracles report logs to IPFS to provide system transparency.

### Colluding Operator Defense

Within the trusted execution environment, we create shared secrets of the DKG-enabled presigned exit messages. The encrypted shares are distributed to the other DAO members, and any oracle can propose to exit a validator, and the shares are used to reconstruct and use the presigned validator exit message on-demand.

### Malicious Leader Defense

A theshold signature of the DAO oracles can elect a new leader as needed, by emitting a contract event detected by the node operators, so the leader can be swiftly replaced if it is at risk of compromise, or simply fails.

### Future

In the future, some aspects of this DAO oracle network may be improved, or become obsolete, as the underlying decentralized protocols evolve:

- SSV contract-native, zero-coordination key operation triggers (with SSV DKG support) may augment or replace the DKG messenger server and the need for a leader oracle service
- Contract-native validator exit triggers may remove the need for presigned validator exit messages

Eventually, the DAO responsibility may be reduceable to an entity providing voting-mechanisms for owners (stakers, operators, and DAO members) to vote on contract changes alongside underlying protocol updates.

## Development

Todo.
