# @casimir/keys

Service to run secure key operations with a RockX DKG messenger

## Usage

Create a new SSV validator with operator key shares and deposit data.

### Install

```zsh
npm install @casimir/keys @casimir/types # (Alternatively install as devDependencies)
```

### Package

Use the package in your Node.js project.

```ts
import { Validator } from '@casimir/types'
import { SSV, CreateValidatorOptions } from '@casimir/keys'

...

const ssv = new SSV({ dkgServiceUrl: 'http://0.0.0.0:8000' })
const options: CreateValidatorOptions = {
    operatorIds: [1, 2, 3, 4],
    withdrawalAddress: '0x07e05700cb4e946ba50244e27f01805354cd8ef0'
}
const validators: Validator[] = await ssv.createValidator(options)
```

### Environment Variables

- `DKG_SERVICE_URL` - URL of the DKG service to use for key generation (default: 'http://0.0.0.0:8000')
- `OPERATOR_IDS` - Four operator registry IDs to use for the key generation (default: [1, 2, 3, 4])
- `WITHDRAWAL_ADDRESS` - Validator withdrawal address (default: '0x07e05700cb4e946ba50244e27f01805354cd8ef0')
