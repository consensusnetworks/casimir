FROM alpine:latest as builder
RUN apk add --no-cache git make bash build-base linux-headers
RUN git clone --depth 1 https://github.com/status-im/nimbus-eth2.git
WORKDIR /nimbus-eth2
RUN make VALIDATORS=192 NODES=6 USER_NODES=1 SECONDS_PER_SLOT=12 USE_GANACHE=yes GANACHE_CMD="echo Using Hardhat instead of Ganache" eth2_network_simulation
# Deploy a deposit contract separately 
# WAIT_GENESIS=yes