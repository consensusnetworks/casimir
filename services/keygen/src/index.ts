import { argv } from 'zx'
import useValidator from './providers/validator'

const { getValidatorInit } = useValidator()

void async function () {
    const { poolId, withdrawalAddress } = argv
    const { operators, shares } = await getValidatorInit(withdrawalAddress)
    console.log({ poolId, operators, shares })
}()