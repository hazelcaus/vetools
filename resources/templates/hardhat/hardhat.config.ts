import "@nomiclabs/hardhat-web3"
import "@nomiclabs/hardhat-ethers"

const VECHAIN_DEFAULT_MNEMONIC = "denial kitchen pet squirrel other broom bar gas better priority spoil cross"
const VECHAIN_URL_SOLO = "http://127.0.0.1:8669"
const VECHAIN_URL_TESTNET = "https://vethor-node-test.vechaindev.com"
const VECHAIN_URL_MAINNET = "https://vethor-node.vechain.com"

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
