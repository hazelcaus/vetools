import { mnemonicToSeed } from "bip39"
import fs from "fs-extra"
// @ts-ignore
import hdkey from "hdkey"
import path from "path"
import { QuickPickItem, Uri, window, workspace } from "vscode"
import { Constants, RequiredApps } from "../Constants"
import {
    get_workspace_root,
    outputCommandHelper,
    required,
    TruffleConfig,
    TruffleConfiguration,
    vscodeEnvironment,
} from "../helpers"
import { show_ignorable_notification, showQuickPick, copy_folders, copy_file, hardhat_to_truffle } from "../utils/utils"
import { Output } from "../Output"
import { MnemonicRepository } from "../services"

import { GanacheCommands } from "./GanacheCommands"

interface IDeployDestinationItem {
    cmd: () => Promise<void>
    cwd?: string
    description?: string
    detail?: string
    label: string
    networkId: string | number
}

interface IExtendedQuickPickItem extends QuickPickItem {
    extended: string
}

export namespace HardhatCommands {
    export async function build_contracts(): Promise<void> {
        await required.install_dependencies()

        await show_ignorable_notification("Compiling Contracts", async () => {
            try {
                await outputCommandHelper.execute(get_workspace_root(), "npx", "hardhat", "compile")
            } catch (err) {
                console.debug("Error:", (err as Error).toString())
            }
        })
    }

    export async function deploy_contracts(): Promise<void> {
        const workspace_root = get_workspace_root()!
        await required.install_dependencies(true)
        await GanacheCommands.start_ganache()

        const destinations = [
            {
                cmd: deploy_to_network.bind(undefined, "development", workspace_root),
                cwd: workspace_root,
                label: "$(plus) Thor Local Node (experimental)",
                networkId: "*",
            },
            {
                cmd: deploy_to_network.bind(undefined, "mainnet", workspace_root),
                cwd: workspace_root,
                description: "Experimental. Use at your own risk.",
                label: "Thor Mainnet",
                networkId: "*",
            },
            {
                cmd: deploy_to_network.bind(undefined, "testnet", workspace_root),
                cwd: workspace_root,
                description: "Deploy to the Thor Testnet",
                label: "Thor Testnet",
                networkId: "*",
            },
        ]

        const command = await showQuickPick(destinations, {
            ignoreFocusOut: true,
            placeHolder: Constants.placeholders.selectDeployDestination,
        })

        await command.cmd()
    }

    async function deploy_to_network(network_type: string, workspace_root: string): Promise<void> {
        let network_name: string
        if (network_type === "mainnet" || network_type === "testnet") {
            network_name = `vechain_${network_type}`
        } else {
            network_name = "development" // development environment TODO
        }

        let should_proceed: boolean = true
        // if (network_name === "development") {
        //     // Spin up a solo node instance
        //     await show_ignorable_notification("Spinning up local VeChain Node", async () => {
        //         try {
        //             await outputCommandHelper.execute(
        //                 "/Users/sluzhba/Documents/dev/thor", // workspace_root,
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
            await show_ignorable_notification(`Deploying contracts to ${capitalized}`, async () => {
                try {
                    await required.install_dependencies()
                    await outputCommandHelper.execute(
                        workspace_root,
                        "node",
                        "scripts/deploy.js",
                        "--network",
                        network_name
                    )

                    // Now locally truffle migrate to local Ganache server
                    // First copy folder contents to temp dir
                    const tmp_dir = Constants.truffle_temp_dir
                    const final_tmp_dir = path.join(Constants.truffle_temp_dir, "migrations")
                    const truffle_config_file = path.join(Constants.templates_directory, "truffle", "truffle-config.js")
                    const truffle_migrations_sol_file = path.join(
                        Constants.templates_directory,
                        "truffle",
                        "Migrations.sol"
                    )
                    const truffle_migrations_folder = path.join(Constants.templates_directory, "truffle", "migrations")

                    copy_folders(get_workspace_root()!, tmp_dir, true)
                    copy_folders(truffle_migrations_folder, final_tmp_dir, true)
                    copy_file(truffle_config_file, path.join(tmp_dir, "truffle-config.js"))
                    try {
                        copy_file(truffle_migrations_sol_file, path.join(tmp_dir, "contracts", "Migrations.sol"))
                    } catch (err) {
                        throw new Error(
                            "Please write all your smart contracts within the `contracts` folder. This is a temporary inconvenience which will be fixed in the upcoming versions of VeTools."
                        )
                    }
                    hardhat_to_truffle(get_workspace_root()!, tmp_dir)

                    await outputCommandHelper.execute(
                        tmp_dir,
                        "truffle",
                        "migrate",
                        "--reset",
                        "--compile-all",
                        "--network",
                        "development"
                    )
                } catch (err) {
                    const msg = `Deployment to ${network_name} failed`
                    Output.output_line(Constants.outputChannel.truffleForVSCode, msg)
                    throw err
                }
            })
        }
    }

    export async function get_private_key_from_mnemonic(): Promise<void> {
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
