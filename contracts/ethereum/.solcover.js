module.exports = {
    mocha: {
        enableTimeouts: false
    },
    skipFiles: [
        'interfaces',
        'mock',
        'test',
        'vendor',
        'CasimirViews.sol'
    ],
    modifierWhitelist: [
        'onlyOracle',
        'onlyOracleOrRegistry',
        'onlyOwner',
        'onlyOwnerOrPool(uint32)',
        'onlyPool(uint32)',
        'onlyRegistry',
        'onlyUpkeep',
        'nonReentrant'
    ]
}