FROM rust:latest as builder
ENV PROFILE=release
RUN git clone --depth 1 https://github.com/sigp/lighthouse.git /tmp/lighthouse
WORKDIR /tmp/lighthouse
RUN make && make install-lcli

FROM alpine:latest
WORKDIR /root/
COPY --from=builder /tmp/lighthouse/target .
COPY --from=builder /tmp/lighthouse/scripts/local_testnet .

CMD [ "./start_local_testnet" ]

