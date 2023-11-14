require("@nomiclabs/hardhat-waffle")
require("@vechain.energy/hardhat-thor")
const SoloDefault = require("thor-builtin").SoloDefault

const PRIVATE_KEY = "0x80b97e2ecfab8b1c78100c418328e8a88624e3d19928ec791a8a51cdcf01f16f"
module.exports = {
    solidity: "0.8.4",
    networks: {
        // This is still unstable and not thoroughly tested
        development: {
            url: "http://127.0.0.1:8669",
            privateKey: SoloDefault.privKeys,
        },
        thor_mainnet: {
            url: "https://mainnet.veblocks.net",
            privateKey: PRIVATE_KEY,
            blockGasLimit: 10000000,
        },
        thor_testnet: {
            url: "https://testnet.veblocks.net",
            privateKey: PRIVATE_KEY,
            delegateUrl: "https://sponsor-testnet.vechain.energy/by/1",
            blockGasLimit: 10000000,
        },
    },
}
