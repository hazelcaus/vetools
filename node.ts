import * as fs from "fs"
import * as path from "path"

function addNetworkToHardhatConfig(networkName: string, networkConfig: Record<string, any>): void {
    const configPath = path.resolve(__dirname, "resources/templates/hardhat/hardhat.config.ts")

    // Read the file
    let configContent = fs.readFileSync(configPath, "utf8")

    // Replace "module.exports = " with "const config = "
    configContent = configContent.replace("module.exports = ", "const config = ")

    // Create the new network entry
    const newNetworkEntry = `
config.networks.${networkName} = {
    url: '${networkConfig.url}',
    mnemonic: ${JSON.stringify(networkConfig.mnemonic)},
    ${Object.entries(networkConfig)
        .filter(([key]) => !["url", "mnemonic"].includes(key))
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join(",\n    ")}
};

`

    // Add the new network entry at the end of the file
    configContent += newNetworkEntry

    // Add module.exports at the end
    configContent += "\nmodule.exports = config;\n"

    // Write the modified content back to the file
    fs.writeFileSync(configPath, configContent, "utf8")

    console.log(`Added network '${networkName}' to hardhat.config.js`)
}

// Usage
addNetworkToHardhatConfig("new_network", {
    url: "https://example.com",
    mnemonic: ["your mnemonic here"],
    chainId: 1234,
})
