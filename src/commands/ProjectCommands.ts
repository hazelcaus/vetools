import fs from "fs-extra"
import * as crypto from "crypto"
import path from "path"
import { Uri, workspace } from "vscode"
import * as vscode from "vscode"
import { Constants } from "../Constants"
import { required, outputCommandHelper, getWorkspaceRoot } from "../helpers"
import { copy_folders, showIgnorableNotification, showOpenFolderDialog, showQuickPick } from "../utils/utils"
import IoHelpers from "../utils/ioHelpers"
import posixPath from "../utils/posixPath"
import { ethers, Wallet } from "ethers"
import { Output } from "../Output"
import { statusBarCommands } from "./StatusBarCommands"
import { getNodeStatus } from "../statusBar/nodeStatus"

export type WalletJson = {
    name: string
    address: string
    publicKey: string
    encryptedPrivateKey: string
}

const RPC_MAP = {
    local: "http://127.0.0.1:8545",
    testnet: "https://sync-testnet.vechain.org",
    mainnet: "https://sync-mainnet.vechain.org",
} as Record<string, string>

export namespace ProjectCommands {
    export async function newProject() {
        await required.installDependencies()

        const project_path = await chooseNewProjectDir()

        await createProject(project_path)
    }

    export async function createWallet() {
        const workspaceRoot = getWorkspaceRoot()
        if (!workspaceRoot) {
            await vscode.window.showErrorMessage(
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
        const walletFilesFolder = posixPath(workspaceRoot, "wallets")
        try {
            await fs.promises.mkdir(walletFilesFolder)
        } catch {}

        const wallet = Wallet.createRandom()

        // Get the address and private key
        const privateKey = wallet.privateKey

        // Encrypt the private key
        const encryptedPrivateKey = xorEncrypt(privateKey, password)

        // trying to decrypt the private key to make sure it's correct
        const decryptedPrivateKey = xorDecrypt(encryptedPrivateKey, password)
        if (decryptedPrivateKey !== privateKey) {
            await vscode.window.showErrorMessage("Failed to encrypt the private key")
            return
        }

        let safeWalletName = walletName.replace(/[^-_.a-z0-9]/gi, "-")
        let filename = posixPath(walletFilesFolder, `${safeWalletName}.vetools-wallet.json`)
        let i = 0
        while (fs.existsSync(filename)) {
            i++
            safeWalletName = `${safeWalletName} (${i})`
            filename = posixPath(walletFilesFolder, `${safeWalletName}.vetools-wallet.json`)
        }

        const walletJson = JSON.stringify(
            {
                name: safeWalletName,
                address: wallet.address,
                publicKey: wallet.publicKey,
                encryptedPrivateKey,
            } as WalletJson,
            null,
            4
        )

        await fs.promises.writeFile(filename, walletJson)
        await vscode.commands.executeCommand("vscode.open", vscode.Uri.file(filename))
    }

    export async function transferAssets() {
        const workspaceRoot = getWorkspaceRoot()
        if (!workspaceRoot) {
            await vscode.window.showErrorMessage(
                "Please open a folder in your Visual Studio Code workspace before creating a wallet"
            )
            return
        }

        // get wallets
        const localWallets = await findLocalWallets()
        console.debug("Local wallets found:", localWallets)
        Output.output_line("VeTools", "Local wallets found: " + JSON.stringify(localWallets))

        const _wallets = localWallets?.map((wallet) => {
            return {
                label: wallet.name,
                description: wallet.address,
                wallet,
            }
        })
        if (!_wallets || _wallets.length === 0) {
            await vscode.window.showErrorMessage(
                "No wallets found. Please create a wallet first (use VeTools > Create Wallet)"
            )
            return
        }
        if (_wallets.length === 1) {
            await vscode.window.showErrorMessage(
                "Only one wallet created; please create another wallet to transfer assets"
            )
            return
        }

        // Choose network first to be able to query wallet balances
        const destinations = [
            {
                cwd: workspaceRoot,
                label: "$(plus) Local Node (experimental)",
                networkId: "local",
            },
            {
                cwd: workspaceRoot,
                description: "Transfer on the Vechain Testnet",
                label: "Vechain Testnet",
                networkId: "testnet",
            },
            {
                cwd: workspaceRoot,
                description: "Experimental. Use at your own risk.",
                label: "Vechain Mainnet",
                networkId: "mainnet",
            },
        ]

        const network = await showQuickPick(destinations, {
            ignoreFocusOut: true,
            placeHolder: "Choose network",
        })

        const provider = new ethers.JsonRpcProvider(RPC_MAP[network.networkId])

        if (network.networkId === "local") {
            const nodeStatus = getNodeStatus()

            // console.log("LOCAL NODE RUNNING?", nodeStatus.text)

            const isLocalNodeRunning = nodeStatus.text.includes("running")
            if (!isLocalNodeRunning) {
                console.log("Starting local node...")
                await statusBarCommands.startLocalNode()
                await new Promise((resolve) => setTimeout(resolve, 2500))
            }

            await showIgnorableNotification("Funding wallets", async () => {
                for (const wallet of _wallets) {
                    const bal = await provider.getBalance(wallet.wallet.address)
                    if (bal.toString() === "0") {
                        await fundUserWallet(wallet.wallet.address, "5")
                    }
                }
            })
        }

        let wallets = [] as { label: string; description: string; wallet: WalletJson; balance: string }[]
        for (const wallet of _wallets) {
            const balance = await provider.getBalance(wallet.wallet.address)
            wallets.push({
                ...wallet,
                description: `${ethers.formatEther(balance.toString())} ETH`,
                balance: balance.toString(),
            })
        }

        const fromWallet = (await showQuickPick(wallets, {
            ignoreFocusOut: true,
            placeHolder: "Choose wallet to send assets FROM",
        })) as any
        Output.output_line(
            "VeTools",
            "From wallet balance: " + fromWallet.balance + ethers.formatEther(fromWallet.balance!)
        )
        const fromWalletBalance = parseFloat(ethers.formatEther(fromWallet.balance!))
        const toWallet = await showQuickPick(
            wallets.filter((wallet: any) => wallet.label !== fromWallet.label),
            {
                ignoreFocusOut: true,
                placeHolder: "Choose wallet to send assets TO",
            }
        )
        const amount = await IoHelpers.enterNumber("Enter amount to transfer")
        if (!amount || amount > fromWalletBalance) {
            await vscode.window.showErrorMessage("Invalid amount (or insufficient balance)")
            return
        }

        // prompt for password
        const enteredPassword = await IoHelpers.enterPassword(`Enter the password for the wallet: ${fromWallet.label}`)
        Output.output_line("VeTools", "Entered password: " + enteredPassword)

        if (enteredPassword === undefined) {
            await vscode.window.showErrorMessage("No password entered. Please enter a password to unlock the wallet")
            return
        }

        const decryptedPrivateKey = ProjectCommands.xorDecrypt(fromWallet.wallet.encryptedPrivateKey, enteredPassword)

        if (!decryptedPrivateKey || !decryptedPrivateKey.startsWith("0x")) {
            await vscode.window.showErrorMessage("Incorrect password to unlock wallet")
            return
        }
        const fromWalletEthers = new Wallet(decryptedPrivateKey, provider)

        await showIgnorableNotification("Transferring assets", async () => {
            const tx = await fromWalletEthers.sendTransaction({
                to: toWallet.wallet.address,
                value: ethers.parseEther(amount.toString()),
            })
            const receipt = await tx.wait()
            console.debug("Transaction receipt:", receipt)
        })
    }

    async function fundUserWallet(address: string, amountInEth: string = "1") {
        const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545")
        const funderWallet = new Wallet(
            "0x7b3ed15194f5d748fed8a692f0256e486f95fb376e86299db6d75bd6400f2248" // 0x401EE82A841dc6B56DAe765bBBF3456Ea79F3B56
        ).connect(provider)

        const tx = await funderWallet.sendTransaction({
            to: address,
            value: ethers.parseEther(amountInEth),
        })
        const receipt = await tx.wait()
        console.debug("Transaction receipt:", receipt)
    }

    export async function findLocalWallets() {
        const workspaceRoot = getWorkspaceRoot()
        if (!workspaceRoot) {
            await vscode.window.showErrorMessage(
                "Please open a folder in your Visual Studio Code workspace before creating a wallet"
            )
            return
        }

        const walletFilesFolder = posixPath(workspaceRoot, "wallets")

        return fs.readdirSync(walletFilesFolder).map((filename) => {
            const walletJson = fs.readFileSync(posixPath(walletFilesFolder, filename), "utf-8")
            return JSON.parse(walletJson) as WalletJson
        })
    }

    export function xorEncrypt(text: string, key: string): string {
        let result = ""
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length))
        }
        return Buffer.from(result).toString("base64")
    }

    export function xorDecrypt(encryptedText: string, key: string): string {
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
