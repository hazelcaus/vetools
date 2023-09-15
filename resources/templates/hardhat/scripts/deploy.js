const hre = require("hardhat")

async function main() {
    // For Thor
    const Token = await hre.thor.getContractFactory("Token")
    const token = await Token.deploy()
    await token.deployed()

    console.log("Token deployed to address:", token.address)

    // Get deployed contract
    const deployedToken = await hre.thor.getContractAt("Token", token.address)
    // Now call any of the contract functions you'd like to call using `deployedToken`
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
