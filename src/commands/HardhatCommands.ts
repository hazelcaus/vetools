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
import { Wallet } from "ethers"

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
        const enteredPassword = await IoHelpers.choosePassword("Enter the password for the selected wallet", true)
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

        if (network_name === "development") {
            const nodeStatus = getNodeStatus()

            console.log("LOCAL NODE RUNNING?", nodeStatus.text)

            const isLocalNodeRunning = nodeStatus.text.includes("running")
            if (!isLocalNodeRunning) {
                console.log("Starting local node...")
                await statusBarCommands.startLocalNode()
            }

            /*
                Modify Hardhat.config.ts
            */
            const hardhatConfigPath = path.join(workspaceRoot, "hardhat.config.ts")

            if (!fs.existsSync(hardhatConfigPath)) {
                throw new Error("hardhat.config.ts not found")
            }
            // modify hardhat.config.ts
            let oldHardhatContents = ""
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
                throw new Error(err)
            } finally {
                // restore hardhat.config.js
                // fs.writeFileSync(hardhatConfigPath, oldHardhatContents)
            }

            network_name = "customDevelopment"

            // Fund the new wallet
            const selectedWallet = new Wallet(privateKey)
            const funderWallet = new Wallet("0x7b3ed15194f5d748fed8a692f0256e486f95fb376e86299db6d75bd6400f2248") // 0x401EE82A841dc6B56DAe765bBBF3456Ea79F3B56
        }

        let should_proceed: boolean = true
        // if (network_name === "development") {
        //     // Spin up a solo node instance
        //     await showIgnorableNotification("Spinning up local VeChain Node", async () => {
        //         try {
        //             await outputCommandHelper.execute(
        //                 "/Users/sluzhba/Documents/dev/thor", // workspaceRoot,
        //                 "bin/thor", "solo", "--on-demand")
        //         } catch (err) {
        //             should_proceed = false
        //             const msg =
        //                 "Couldn't spin up local Thor node. Did you follow the installation requirements correctly? Is `bin/thor` accessible via your terminal?"
        //             Output.output_line(Constants.outputChannel.truffleForVSCode, (err as Error).toString())
        //             throw new Error(msg)
        //         }
        //     })
        // }

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

                    // // Now locally truffle migrate to local Ganache server
                    // // First copy folder contents to temp dir
                    // const tmp_dir = Constants.truffle_temp_dir
                    // const final_tmp_dir = path.join(Constants.truffle_temp_dir, "migrations")
                    // const truffle_config_file = path.join(Constants.templates_directory, "truffle", "truffle-config.js")
                    // const truffle_migrations_sol_file = path.join(
                    //     Constants.templates_directory,
                    //     "truffle",
                    //     "Migrations.sol"
                    // )
                    // const truffle_migrations_folder = path.join(Constants.templates_directory, "truffle", "migrations")

                    // copy_folders(getWorkspaceRoot()!, tmp_dir, true)
                    // copy_folders(truffle_migrations_folder, final_tmp_dir, true)
                    // copy_file(truffle_config_file, path.join(tmp_dir, "truffle-config.js"))
                    // try {
                    //     copy_file(truffle_migrations_sol_file, path.join(tmp_dir, "contracts", "Migrations.sol"))
                    // } catch (err) {
                    //     throw new Error(
                    //         "Please write all your smart contracts within the `contracts` folder. This is a temporary inconvenience which will be fixed in the upcoming versions of VeTools."
                    //     )
                    // }
                    // hardhat_to_truffle(getWorkspaceRoot()!, tmp_dir)

                    // await outputCommandHelper.execute(
                    //     tmp_dir,
                    //     "truffle",
                    //     "migrate",
                    //     "--reset",
                    //     "--compile-all",
                    //     "--network",
                    //     "development"
                    // )
                } catch (err) {
                    const msg = `Deployment to ${network_name} failed`
                    Output.output_line("VeTools", msg)
                    throw err
                }
            })
        }
    }

    export async function get_private_key_from_mnemonic() {
        const mnemonic_items: IExtendedQuickPickItem[] = MnemonicRepository.getExistedMnemonicPaths().map(
            (mnemonic_path) => {
                const saved_mnemonic = MnemonicRepository.get_mnemonic(mnemonic_path)
                return {
                    detail: mnemonic_path,
                    extended: saved_mnemonic,
                    label: MnemonicRepository.MaskMnemonic(saved_mnemonic),
                }
            }
        )

        if (mnemonic_items.length === 0) {
            window.showErrorMessage(Constants.errorMessageStrings.ThereAreNoMnemonics)
            return
        }

        const mnemonic_item = await showQuickPick(mnemonic_items, {
            placeHolder: Constants.placeholders.selectMnemonicExtractKey,
            ignoreFocusOut: true,
        })

        const mnemonic = mnemonic_item.extended
        if (!mnemonic) {
            window.showErrorMessage(Constants.errorMessageStrings.MnemonicFileHaveNoText)
            return
        }

        try {
            const buffer = await mnemonicToSeed(mnemonic)
            const key = hdkey.fromMasterSeed(buffer)
            const childKey = key.derive("m/44'/60'/0'/0/0")
            const privateKey = childKey.privateKey.toString("hex")
            await vscodeEnvironment.writeToClipboard(privateKey)
            window.showInformationMessage(Constants.informationMessage.privateKeyWasCopiedToClipboard)
        } catch (error) {
            window.showErrorMessage(Constants.errorMessageStrings.InvalidMnemonic)
        }
    }
}
