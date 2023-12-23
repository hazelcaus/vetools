import fs from "fs-extra"
import path from "path"
import { InputBoxOptions, ProgressLocation, QuickPickItem, QuickPickOptions, Uri, window, workspace } from "vscode"
import { Constants, NotificationOptions } from "../Constants"
import { CancellationEvent } from "../Models"
import { DialogResultValidator } from "../validators/DialogResultValidator"

export async function showInputBox(options: InputBoxOptions): Promise<string> {
    const result = await window.showInputBox(options)

    if (result === undefined) {
        throw new CancellationEvent()
    }

    return result
}

export async function showQuickPickMany<T extends QuickPickItem>(
    items: T[] | Promise<T[]>,
    options: QuickPickOptions & { canPickMany: true }
): Promise<T[]> {
    const result = await window.showQuickPick(items, options)

    if (result === undefined) {
        throw new CancellationEvent()
    }

    return result
}

export async function showQuickPick<T extends QuickPickItem>(
    items: T[] | Promise<T[]>,
    options: QuickPickOptions
): Promise<T> {
    const result = await window.showQuickPick(items, options)

    if (result === undefined) {
        throw new CancellationEvent()
    }

    return result
}

export async function showConfirmPaidOperationDialog() {
    const answer = await showInputBox({
        ignoreFocusOut: true,
        prompt: Constants.placeholders.confirmPaidOperation,
        validateInput: DialogResultValidator.validateConfirmationResult,
    })

    if (answer.toLowerCase() !== Constants.confirmationDialogResult.yes.toLowerCase()) {
        throw new CancellationEvent()
    }
}

export function copy_file(from: string, to: string) {
    const contents = fs.readFileSync(from, "utf-8")
    fs.writeFileSync(to, contents, "utf8")
}

export function copy_folders(from: string, to: string, should_delete_to: boolean = false) {
    if (should_delete_to && fs.existsSync(to)) {
        fs.rmSync(to, { recursive: true, force: true })
        fs.mkdirSync(to)
    }

    if (!fs.existsSync(to)) {
        fs.mkdirsSync(to)
    }

    const files = fs.readdirSync(from)
    files.forEach((file) => {
        const original = path.join(from, file)
        const stats = fs.statSync(original)

        if (stats.isFile()) {
            const _path = path.join(to, file)
            copy_file(original, _path)
        } else if (stats.isDirectory()) {
            fs.mkdirSync(path.join(to, file))
            copy_folders(path.join(from, file), path.join(to, file))
        }
    })
}

export async function show_open_folder_dialog(): Promise<string> {
    const folder = await window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: "Choose new path",
    })

    if (!folder) {
        throw new CancellationEvent()
    }

    return folder[0].fsPath
}

export async function showOpenFileDialog(): Promise<string> {
    const defaultFolder = workspace.workspaceFolders ? workspace.workspaceFolders[0].uri.fsPath : ""
    const folder = await window.showSaveDialog({
        defaultUri: Uri.parse(defaultFolder),
        saveLabel: Constants.placeholders.selectMnemonicStorage,
    })

    if (!folder) {
        throw new CancellationEvent()
    }

    return folder.fsPath
}

export async function saveTextInFile(
    text: string,
    defaultFilename: string,
    ext?: { [name: string]: string[] }
): Promise<string> {
    const file = await window.showSaveDialog({
        defaultUri: Uri.file(defaultFilename),
        filters: ext,
    })

    if (!file) {
        throw new CancellationEvent()
    }

    fs.writeFileSync(file.fsPath, text)
    return file.fsPath
}

export async function showConfirmationDialog(message: string): Promise<boolean> {
    const answer = await window.showInformationMessage(
        message,
        Constants.confirmationDialogResult.yes,
        Constants.confirmationDialogResult.no
    )

    return answer === Constants.confirmationDialogResult.yes
}

export async function showNotification(options: Notification.IShowNotificationOptions): Promise<void> {
    options.type = options.type || NotificationOptions.info

    Notification.types[options.type](options.message)
}

export async function show_ignorable_notification(message: string, fn: () => Promise<any>): Promise<void> {
    const ignoreNotification = false

    await window.withProgress(
        {
            location: ProgressLocation.Window,
            title: message,
        },
        async () => {
            if (ignoreNotification) {
                await fn()
            } else {
                await window.withProgress(
                    {
                        location: ProgressLocation.Notification,
                        title: message,
                    },
                    fn
                )
            }
        }
    )
}

export async function showNotificationConfirmationDialog(
    message: string,
    positiveAnswer: string,
    cancel: string
): Promise<boolean> {
    const answer = await window.showInformationMessage(message, positiveAnswer, cancel)

    return answer === positiveAnswer
}

namespace Notification {
    export const types = {
        error: window.showErrorMessage,
        info: window.showInformationMessage,
        warning: window.showWarningMessage,
    }

    export interface IShowNotificationOptions {
        type?: NotificationOptions.error | NotificationOptions.warning | NotificationOptions.info
        message: string
    }
}

export function hardhat_to_truffle(hardhat_folder: string, truffle_folder: string) {
    const hardhat_contracts_folder = path.join(hardhat_folder, "contracts")
    if (!fs.existsSync(hardhat_contracts_folder)) {
        throw new Error(
            "Please write all your smart contracts within the `contracts` folder. This is a temporary inconvenience which will be fixed in the upcoming versions of VeTools."
        )
    }

    // This doesn't handle complex directories
    const __all_contracts = fs.readdirSync(hardhat_contracts_folder)
    let all_contracts = []
    for (let i = 0; i < __all_contracts.length; i++) {
        const contract = __all_contracts[i]
        if (contract.endsWith(".sol") && !contract.toLowerCase().includes("migrations")) {
            all_contracts.push(contract)
        }
    }
    console.debug(`Contracts found in ${hardhat_contracts_folder}: `, all_contracts)

    const truffle_contracts_folder = path.join(truffle_folder, "contracts")
    if (!fs.existsSync(truffle_contracts_folder)) {
        throw new Error("Internal error. Truffle Contracts folder should exist")
    }

    // Create separate files for migrations
    if (!fs.existsSync(Constants.truffle_migrations_temp_dir)) {
        fs.mkdir(Constants.truffle_migrations_temp_dir)
    }
    const write_migrations_file = path.join(Constants.truffle_migrations_temp_dir, "2_deploy_contracts.js")

    let require_files = ""
    let deployer_funcs = ""

    all_contracts.forEach((contract) => {
        const contract_name = contract.replace(".sol", "")

        require_files += `const ${contract_name} = artifacts.require("${contract_name}");\n `
        deployer_funcs += `deployer.deploy(${contract_name}); `
    })

    const text = `
    ${require_files}

    module.exports = function(deployer) {
        ${deployer_funcs}
    }
    `

    // Write migrations file
    fs.writeFileSync(write_migrations_file, text, "utf-8")
}
