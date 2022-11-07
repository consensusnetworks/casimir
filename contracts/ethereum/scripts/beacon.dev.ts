import { $, cd } from 'zx'

void async function () {
    // cd('scripts/resources/lighthouse')

    // try { await $`cargo -v` } catch { await $`brew install rust` }
    // try { await $`protoc -v` } catch { await $`brew install protobuf` }

    // await $`$PROFILE = "release" && make && make install-lcli`
    // $`./start_local_testnet.sh`

    await $`docker build . --tag lighthouse -f scripts/docker/lighthouse.Dockerfile`
    $`docker docker run --rm lighthouse`
}()