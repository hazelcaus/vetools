import fs from "fs-extra"
import * as crypto from "crypto"
import path from "path"
import { Uri, workspace } from "vscode"
import * as vscode from "vscode"
import { Constants } from "../Constants"
import { required, outputCommandHelper, getWorkspaceRoot } from "../helpers"
import { copy_folders, showIgnorableNotification, showOpenFolderDialog } from "../utils/utils"
import IoHelpers from "../utils/ioHelpers"
import posixPath from "../utils/posixPath"
import { Wallet } from "ethers"

export namespace ProjectCommands {
    export async function newProject() {
        await required.installDependencies()

        const project_path = await chooseNewProjectDir()

        await createProject(project_path)
    }

    export async function createWallet() {
        const rootFolder = getWorkspaceRoot()
        if (!rootFolder) {
            vscode.window.showErrorMessage(
                "Please open a folder in your Visual Studio Code workspace before creating a wallet"
            )
            return
        }

        const walletName = await IoHelpers.enterString("Wallet name")
        if (!walletName) {
            return
        }

        const password = await IoHelpers.choosePassword("Choose a password for the wallet (press Enter for none)", true)
        if (!password && password !== "") {
            return
        }

        // create `wallets` folder
        const walletFilesFolder = posixPath(rootFolder, "wallets")
        try {
            await fs.promises.mkdir(walletFilesFolder)
        } catch {}

        const wallet = Wallet.createRandom()

        // Get the address and private key
        const privateKey = wallet.privateKey

        // Encrypt the private key
        const encryptedPrivateKey = xorEncrypt(privateKey, password)

        const walletJson = JSON.stringify(
            {
                name: walletName,
                publicKey: wallet.publicKey,
                privateKey: wallet.privateKey,
                encryptedPrivateKey,
            },
            null,
            4
        )

        // trying to decrypt the private key to make sure it's correct
        const decryptedPrivateKey = xorDecrypt(encryptedPrivateKey, password)
        if (decryptedPrivateKey !== privateKey) {
            await vscode.window.showErrorMessage("Failed to encrypt the private key")
            return
        }

        const safeWalletName = walletName.replace(/[^-_.a-z0-9]/gi, "-")
        let filename = posixPath(walletFilesFolder, `${safeWalletName}.vetools-wallet.json`)
        let i = 0
        while (fs.existsSync(filename)) {
            i++
            filename = posixPath(walletFilesFolder, `${safeWalletName} (${i}).vetools-wallet.json`)
        }
        await fs.promises.writeFile(filename, walletJson)
        await vscode.commands.executeCommand("vscode.open", vscode.Uri.file(filename))
    }

    function xorEncrypt(text: string, key: string): string {
        let result = ""
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length))
        }
        return Buffer.from(result).toString("base64")
    }

    function xorDecrypt(encryptedText: string, key: string): string {
        const buffer = Buffer.from(encryptedText, "base64")
        let result = ""
        for (let i = 0; i < buffer.length; i++) {
            result += String.fromCharCode(buffer[i] ^ key.charCodeAt(i % key.length))
        }
        return result
    }
}

async function chooseNewProjectDir(): Promise<string> {
    const project_path = await showOpenFolderDialog()

    await fs.ensureDir(project_path)
    const files = await fs.readdir(project_path)

    // Temporarily disable for Gitpod
    // if(files.length) {
    //     const answer = await window.showErrorMessage(
    //         Constants.errorMessageStrings.DirectoryIsNotEmpty,
    //         Constants.informationMessage.openButton,
    //         Constants.informationMessage.cancelButton
    //     );

    //     if(answer === Constants.informationMessage.openButton) {
    //         return chooseNewProjectDir();
    //     } else {
    //         throw new CancellationEvent();
    //     }
    // }

    return project_path
}

async function createProject(project_path: string) {
    await showIgnorableNotification("Creating new VeTools project", async () => {
        try {
            const from = path.join(Constants.templates_directory, "hardhat")
            copy_folders(from, project_path)

            console.debug("workspace.workspaceFolder:", workspace.workspaceFolders)
            workspace.updateWorkspaceFolders(0, workspace.workspaceFolders ? workspace.workspaceFolders.length : null, {
                uri: Uri.file(project_path),
            })
            console.debug("workspace.workspaceFolder:", workspace.workspaceFolders)
        } catch (error) {
            fs.emptyDirSync(project_path)
            throw new Error(`Could not create project. 'createProject' failed: ${(error as Error).message}`)
        }
    })

    await showIgnorableNotification("Installing dependencies", async () => {
        try {
            // npm install
            await outputCommandHelper.execute(project_path, "npm", "install -f")
        } catch (err) {
            throw new Error(
                `Failed to set up dependencies. Do you have npm configured correctly? ${(err as Error).message}`
            )
        }
    })

    await required.installDependencies()
}
