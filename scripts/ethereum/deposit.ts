import { $ } from 'zx'

void async function () {
    await $`docker pull nethermindeth/staking-deposit-cli`
    await $`docker run -it --rm -v $(pwd)/validator_keys:/app/validator_keys nethermindeth/staking-deposit-cli new-mnemonic --mnemonic_language=english --num_validators=1 --chain=prater`
}()
