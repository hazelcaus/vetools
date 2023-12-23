import path from "path"
import { debug, workspace, WorkspaceFolder, QuickPickItem, Uri } from "vscode"
import { DEBUG_TYPE } from "../debugAdapter/constants/debugAdapter"
import { TransactionProvider } from "../debugAdapter/transaction/transactionProvider"
import { Web3Wrapper } from "../debugAdapter/web3Wrapper"
import { Constants } from "../Constants"
import { copy_folders, showQuickPick } from "../utils/utils"

export namespace DebuggerCommands {
    export async function start_debugger() {
        const working_directory = get_working_directory()
        if (!working_directory) return

        const contracts_build_directory = Constants.truffle_config.contracts_build_directory

        let web3
        let provider_url
        try {
            web3 = new Web3Wrapper()
            provider_url = web3.getProviderUrl()
        } catch (err) {
            throw new Error("Have you deployed any contracts in this VSCode Session?")
        }

        const workspace_folder = get_root_workspace()

        // Get last transactions
        const transaction_provider = new TransactionProvider(web3, contracts_build_directory)
        const tx_hashes_as_quickpick_items = await get_quickpick_items(transaction_provider)

        const selected_txHash = await showQuickPick(tx_hashes_as_quickpick_items.items, {
            ignoreFocusOut: true,
            placeHolder: "Select the contract to debug",
        })

        const txHash = tx_hashes_as_quickpick_items.map[selected_txHash.label]

        copy_folders(contracts_build_directory, path.join(working_directory, "build", "contracts"), true)

        const config = {
            files: [],
            name: "Debug Smart Contracts",
            provider_url: provider_url,
            request: "launch",
            txHash: txHash,
            type: DEBUG_TYPE,
            working_directory: working_directory,
            timeout: 30000,
        }
        console.debug(`Before debugging`)

        debug.startDebugging(undefined, config).then(() => {
            console.debug("Debugging finished. ")
        })

        console.debug(`After debugging`)
    }
}

async function get_quickpick_items(tx_provider: TransactionProvider) {
    const tx_hashes = await tx_provider.get_last_transaction_hashes()
    const tx_infos = await tx_provider.get_transactions_info(tx_hashes)

    let tx_infos_items: QuickPickItem[] = []
    let tx_infos_items_map: any = {}

    tx_infos.map((tx_info) => {
        const label = __generate_label(tx_info.contractName)

        if (!label.toLowerCase().includes("migrations") && tx_info.contractName) {
            tx_infos_items.push({
                alwaysShow: true,
                label: label,
                description: "",
                detail: "",
            })
            tx_infos_items_map[label] = tx_info.hash
        }
    })

    console.debug("tx_infos_items:", tx_infos_items)

    return {
        items: tx_infos_items,
        map: tx_infos_items_map,
    }
}

function get_root_workspace(): WorkspaceFolder | undefined {
    if (typeof workspace.workspaceFolders === "undefined" || workspace.workspaceFolders.length === 0) {
        return undefined
    }
    return workspace.workspaceFolders[0]
}

function get_working_directory(): string {
    const workspace_folder = get_root_workspace()
    return workspace_folder === undefined ? "" : workspace_folder.uri.fsPath
}

function __generate_label(contract_name: string) {
    const contract_name_without_ext = path.basename(contract_name, ".json")
    return `${contract_name_without_ext}.sol`
}
