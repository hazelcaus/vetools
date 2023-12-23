const hre = require("hardhat")

async function main() {
    // const [deployer] = await ethers.getSigners()

    const Token = await hre.ethers.getContractFactory("Token")
    const token = await Token.deploy()
    await token.deployed()

    console.log("Token deployed to address:", token.address)

    // Get deployed contract
    const deployedToken = await hre.ethers.getContractAt("Token", token.address)

    // Now call any of the contract functions you'd like to call using `deployedToken`
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
