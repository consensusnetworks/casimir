# @casimir/keys

Casimir key generation service and CLI

## Usage

Create a new validator for Casimir with operator key shares and deposit data.

### Install

```zsh
npm install @casimir/keys @casimir/types # Or with -D, -g, etc.
```

### Package

```ts
import { Validator } from '@casimir/types'
import { SSV } from '@casimir/keys'

...

const ssv = new SSV({ dkgServiceUrl: 'http://0.0.0.0:8000' })
const validators: Validator[] = await ssv.createValidator({
    operatorIds: [1, 2, 3, 4],
    withdrawalAddress: '0x07e05700cb4e946ba50244e27f01805354cd8ef0'
})
```

### CLI

```zsh
npx casimir-keys create-validator
```

Options:

- `--dkgServiceUrl` - URL of the DKG service to use for key generation (default: 'http://0.0.0.0:8000')
- `--operatorIds` - Four operator registry IDs to use for the key generation (default: [1, 2, 3, 4])
- `--withdrawalAddress` - Validator withdrawal address (default: '0x07e05700cb4e946ba50244e27f01805354cd8ef0')

> 🚩 If you'd like to save validator output, add ./data/validator_store.json to the current package directory.
