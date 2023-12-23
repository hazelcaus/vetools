require("@nomiclabs/hardhat-web3")
require("@vechain/hardhat-web3")
const {
    VECHAIN_URL_SOLO,
    VECHAIN_URL_TESTNET,
    VECHAIN_URL_MAINNET,
    VECHAIN_DEFAULT_MNEMONIC,
} = require("@vechain/hardhat-vechain")

module.exports = {
    solidity: "0.8.4",
    networks: {
        // This is still unstable and not thoroughly tested
        development: {
            url: VECHAIN_URL_SOLO,
            mnemonic: [VECHAIN_DEFAULT_MNEMONIC],
        },
        vechain_mainnet: {
            url: VECHAIN_URL_MAINNET,
            mnemonic: [VECHAIN_DEFAULT_MNEMONIC],
        },
        vechain_testnet: {
            url: VECHAIN_URL_TESTNET,
            mnemonic: [VECHAIN_DEFAULT_MNEMONIC],
            delegate: {
                url: "${feeDelegationServiceUrl}",
                signer: "${optionalSigner}",
            },
        },
    },
}
