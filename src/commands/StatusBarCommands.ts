import { exec } from "child_process"
import { Memento, window, Terminal } from "vscode"
import * as vscode from "vscode"
import { IExtensionAdapter, HardhatExtensionAdapter } from "../services/extensionAdapter"
import { get_workspace_root, outputCommandHelper } from "../helpers"

class StatusBarCommands {
    // @ts-ignore
    private global_state?: Memento
    private type = "local-node"

    public async initialize(global_state: Memento): Promise<void> {
        this.global_state = global_state
    }

    public async startLocalNode(): Promise<void> {
        const terminal = this.get()
        terminal.sendText("ganache-cli")
        terminal.show(true)
        window.showInformationMessage(`Started local node`)
    }

    public async stopLocalNode(): Promise<void> {
        const workspace_root = get_workspace_root()!
        await outputCommandHelper.execute(workspace_root, "pkill -f", "ganache-cli")
        window.showInformationMessage(`Stopped local node`)
    }

    public isLocalNodeRunning(): boolean {
        let isNodeRunning: boolean = false
        exec(`ps aux | grep -i ganache`, (_error, stdout, _stderr) => {
            isNodeRunning = stdout.includes("ganache-cli")
        })

        return isNodeRunning
    }

    private get(): vscode.Terminal {
        const existing = vscode.window.terminals.find((t) => t.name === this.type)
        return existing ?? vscode.window.createTerminal(this.type)
    }
}

export const statusBarCommands = new StatusBarCommands()
