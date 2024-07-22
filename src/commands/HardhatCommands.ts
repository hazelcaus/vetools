import * as vscode from "vscode"
import * as fs from "fs-extra"
import { exec } from "child_process"
import { mnemonicToSeed } from "bip39"
// @ts-ignore
import hdkey from "hdkey"
import path from "path"
import { QuickPickItem, Uri, window, workspace } from "vscode"
import { Constants, RequiredApps } from "../Constants"
import { getWorkspaceRoot, outputCommandHelper, required, vscodeEnvironment } from "../helpers"
import { showIgnorableNotification, showQuickPick } from "../utils/utils"
import { Output } from "../Output"
import { MnemonicRepository } from "../services"

import { statusBarCommands } from "./StatusBarCommands"
import { getNodeStatus } from "../statusBar/nodeStatus"
import { ProjectCommands } from "./ProjectCommands"
import IoHelpers from "../utils/ioHelpers"
import { ethers, Wallet } from "ethers"

interface IExtendedQuickPickItem extends QuickPickItem {
    extended: string
}

export namespace HardhatCommands {
    export async function buildContracts() {
        await required.installDependencies()

        await showIgnorableNotification("Compiling Contracts", async () => {
            try {
                await outputCommandHelper.execute(getWorkspaceRoot(), "npm", "run", "compile")
            } catch (err) {
                console.debug("Error:", (err as Error).toString())
            }
        })
    }

    export async function deployContracts() {
        const workspaceRoot = getWorkspaceRoot()!
        if (!workspaceRoot) {
            await vscode.window.showErrorMessage(
                "Please open a folder in your Visual Studio Code workspace before creating a wallet"
            )
            return
        }
        await required.installDependencies(true)

        // get wallets
        const localWallets = await ProjectCommands.findLocalWallets()
        console.debug("Local wallets found:", localWallets)
        Output.output_line("VeTools", "Local wallets found: " + JSON.stringify(localWallets))

        const wallets = localWallets?.map((wallet) => {
            return {
                label: wallet.name,
                description: wallet.address,
                wallet,
            }
        })
        if (!wallets || wallets.length === 0) {
            await vscode.window.showErrorMessage(
                "No wallets found. Please create a wallet first (use VeTools > Create Wallet)"
            )
            return
        }
        const selectedWallet = await showQuickPick(wallets, { ignoreFocusOut: true, placeHolder: "Select a wallet" })

        // prompt for password
        const enteredPassword = await IoHelpers.enterPassword("Enter the password for the selected wallet")
        Output.output_line("VeTools", "Entered password: " + enteredPassword)

        if (enteredPassword === undefined) {
            await vscode.window.showErrorMessage("No password entered. Please enter a password to unlock the wallet")
            return
        }

        const decryptedPrivateKey = ProjectCommands.xorDecrypt(
            selectedWallet.wallet.encryptedPrivateKey,
            enteredPassword
        )
        if (!decryptedPrivateKey || !decryptedPrivateKey.startsWith("0x")) {
            await vscode.window.showErrorMessage("Incorrect password to unlock wallet")
            return
        }
        const wallet = new Wallet(decryptedPrivateKey)

        Output.output_line("VeTools", "Address: " + wallet.address)
        Output.output_line("VeTools", "Selected wallet address: " + selectedWallet.wallet.address)

        if (wallet.address !== selectedWallet.wallet.address) {
            await vscode.window.showErrorMessage("Incorrect password to unlock wallet")
            return
        }

        const destinations = [
            {
                cmd: deployToNetwork.bind(undefined, "development", workspaceRoot, wallet.privateKey),
                cwd: workspaceRoot,
                label: "$(plus) Local Node (experimental)",
                networkId: "*",
            },
            {
                cmd: deployToNetwork.bind(undefined, "testnet", workspaceRoot, wallet.privateKey),
                cwd: workspaceRoot,
                description: "Deploy to the Vechain Testnet",
                label: "Vechain Testnet",
                networkId: "*",
            },
            {
                cmd: deployToNetwork.bind(undefined, "mainnet", workspaceRoot, wallet.privateKey),
                cwd: workspaceRoot,
                description: "Experimental. Use at your own risk.",
                label: "Vechain Mainnet",
                networkId: "*",
            },
        ]

        const command = await showQuickPick(destinations, {
            ignoreFocusOut: true,
            placeHolder: Constants.placeholders.selectDeployDestination,
        })

        await command.cmd()
    }

    async function deployToNetwork(network_type: string, workspaceRoot: string, privateKey: string) {
        let network_name: string
        if (network_type === "mainnet" || network_type === "testnet") {
            network_name = `vechain_${network_type}`
        } else {
            network_name = "development" // development environment TODO
        }

        /*
                Modify Hardhat.config.ts
            */
        const hardhatConfigPath = path.join(workspaceRoot, "hardhat.config.ts")

        if (!fs.existsSync(hardhatConfigPath)) {
            throw new Error("hardhat.config.ts not found")
        }

        // modify hardhat.config.ts
        let oldHardhatContents = fs.readFileSync(hardhatConfigPath, "utf8")

        if (network_name === "development") {
            const nodeStatus = getNodeStatus()

            console.log("LOCAL NODE RUNNING?", nodeStatus.text)

            const isLocalNodeRunning = nodeStatus.text.includes("running")
            if (!isLocalNodeRunning) {
                console.log("Starting local node...")
                await statusBarCommands.startLocalNode()
                await new Promise((resolve) => setTimeout(resolve, 2500))
            }

            try {
                let contents = fs.readFileSync(hardhatConfigPath, "utf8")
                oldHardhatContents = contents

                // Replace "module.exports = " with "const config = "
                contents = contents.replace("module.exports = ", "const config = ")

                // Create the new network entry
                const newNetworkEntry = `
config.networks = {
    ...config.networks,
    customDevelopment: {
        url: VECHAIN_URL_SOLO,
        accounts: ["${privateKey}"]
    }
}
`
                // Add the new network entry at the end of the file
                contents += newNetworkEntry

                // Add module.exports at the end
                contents += "\nmodule.exports = config;\n"

                // Write the modified content back to the file
                fs.writeFileSync(hardhatConfigPath, contents, "utf8")
            } catch (err: any) {
                fs.writeFileSync(hardhatConfigPath, oldHardhatContents)
                throw new Error(err)
            }

            network_name = "customDevelopment"

            // Fund the new wallet
            await fundUserWallet(privateKey)
        }

        let should_proceed: boolean = true

        const capitalized = network_type.charAt(0).toUpperCase() + network_type.slice(1)
        if (should_proceed) {
            await showIgnorableNotification(`Deploying contracts to ${capitalized} (${network_name})`, async () => {
                try {
                    await required.installDependencies()
                    await outputCommandHelper.execute(
                        workspaceRoot,
                        "npx",
                        "hardhat",
                        "run",
                        "scripts/deploy.ts",
                        "--network",
                        network_name
                    )
                    vscode.window.showInformationMessage(
                        `Contract deployed to "${
                            ["customDevelopment", "development"].includes(network_name) ? "local node" : network_name
                        }" successfully`
                    )
                } catch (err) {
                    const msg = `Deployment to ${network_name} failed`
                    Output.output_line("VeTools", msg)
                    throw err
                } finally {
                    fs.writeFileSync(hardhatConfigPath, oldHardhatContents)
                }
            })
        }
    }

    async function fundUserWallet(selectedWalletPrivateKey: string) {
        const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545")
        const selectedWallet = new Wallet(selectedWalletPrivateKey)
        const funderWallet = new Wallet(
            "0x7b3ed15194f5d748fed8a692f0256e486f95fb376e86299db6d75bd6400f2248" // 0x401EE82A841dc6B56DAe765bBBF3456Ea79F3B56
        ).connect(provider)

        const tx = await funderWallet.sendTransaction({
            to: selectedWallet.address,
            value: ethers.parseEther("1"),
        })
        const receipt = await tx.wait()
        console.debug("Transaction receipt:", receipt)
    }
}
