import { ethers } from "ethers"

async function main() {
    const provider = new ethers.JsonRpcProvider("https://rpc-testnet.vechain.energy")
    const balance = await provider.getBalance("0x407d73d8a49eeb85d32cf465507dd71d507100c1")
    console.log("Balance:", balance.toString())
}

main()
    .then()
    .catch((err) => {
        console.error(err)
        process.exit(1)
    })
