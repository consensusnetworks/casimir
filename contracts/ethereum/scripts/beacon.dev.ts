import { $ } from 'zx'

void async function () {
    await $`docker build . --tag nimbus -f scripts/resources/custom/nimbus.Dockerfile`
    $`docker run --rm nimbus`
}()