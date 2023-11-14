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

import { ServerCommands } from "./ServerCommands"

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

        await show_ignorable_notification("Compiling Contracts...", async () => {
            try {
                await outputCommandHelper.execute(get_workspace_root(), "npm", "run", "compile")
                
            } catch (err) {
                console.debug("Error:", err)
                throw new Error("Local dependencies are not installed. Run `npm i` or `yarn`, and try the command again.")
            }
        })
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
