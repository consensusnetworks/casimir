// import { packResponse, unpackResponse } from '../helpers/upkeep'
// import { expect } from 'chai'

// describe('Pack/unpack', function() {
//     it('Should correctly pack and unpack the summary response', function() {
//         const packed = packResponse({
//             values: ['32105000000', '1', '0', '0', '0'],
//             bits: [128, 32, 32, 32, 32]
//         })
//         const unpacked = unpackResponse({ packed: packed.toString(), bits: [128, 32, 32, 32, 32] })
//         expect(unpacked[0]).to.equal('32105000000')
//         expect(unpacked[1]).to.equal('1')
//         expect(unpacked[2]).to.equal('0')
//         expect(unpacked[3]).to.equal('0')
//         expect(unpacked[4]).to.equal('0')
//     })
// })