# Image with all the dependencies required to run
# the Trezor emulator from the command-line.

FROM python:3.7-slim

RUN apt-get update \
    && apt-get install gcc protobuf-compiler curl make git scons libsdl2-dev libsdl2-image-dev llvm-dev libclang-dev clang -y \
    && apt-get clean

RUN pip install --upgrade pip --no-cache-dir
RUN pip install poetry --no-cache-dir

WORKDIR /app

COPY . .

RUN poetry config virtualenvs.create false
RUN poetry install --no-interaction

WORKDIR /app/core

# Build trezor core
RUN curl https://sh.rustup.rs -sSf | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"
RUN rustup install nightly
RUN rustup default nightly
RUN make build_unix_debug

# Run emulator
ENTRYPOINT [ "poetry" ]
CMD [ "run", "./emu.py", "--seed=${BIP39_SEED}" ]