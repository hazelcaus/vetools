const path = require("path")

try {
    const hdwalletNodeModulePath = path.join(process.cwd(), "node_modules", "truffle-hdwallet-provider")
    require(hdwalletNodeModulePath)
    require.cache[require.resolve(hdwalletNodeModulePath)].exports = function HDWallet(...args) {
        this.mnemonic = args[0]
        this.url = args[1]
    }
} catch (err) {
    // ignore
}

console.debug("BEFORE")
const truffleConfig = require(path.join(process.cwd(), "truffle-config.js"))
console.debug("AFTER")

const getCircularReplacer = () => {
    const seen = new WeakSet()
    return (k, v) => {
        if (typeof v === "object" && v !== null) {
            if (seen.has(v)) {
                return
            }
            seen.add(v)
        }

        if (typeof v === "function") {
            if (k !== "provider") {
                return v.toString()
            }

            return v.call(truffleConfig)
        }

        return v
    }
}

let message = JSON.stringify(truffleConfig, getCircularReplacer())

process.send({ command: "truffleConfig", message: message }, () => process.exit())
