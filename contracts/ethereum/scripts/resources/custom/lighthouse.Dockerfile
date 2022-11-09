FROM rust:alpine as builder
RUN apk add --no-cache musl-dev protobuf protobuf-dev git make pkgconfig openssl openssl-devel
ENV PROTOC /usr/bin/protoc

ENV PROFILE release
RUN git clone --depth 1 https://github.com/sigp/lighthouse.git
WORKDIR /lighthouse
RUN make && make install-lcli

FROM alpine:latest
COPY --from=builder . .

CMD [ "./scripts/start_local_testnet" ]

