import { exec } from "child_process"
import { StatusBarAlignment, StatusBarItem, ThemeColor, window } from "vscode"

let nodeStatus: StatusBarItem
let isNodeRunning: boolean

export const getNodeStatus = () => {
    if (!nodeStatus) {
        nodeStatus = window.createStatusBarItem(StatusBarAlignment.Left, 100)
    }
    return nodeStatus
}

export default function updateNodeStatus() {
    const initializedItem = getNodeStatus() as any
    exec(`ps aux | grep -i ganache`, (_error, stdout, _stderr) => {
        isNodeRunning = stdout.includes("ganache-cli")
    })

    if (isNodeRunning) {
        initializedItem.text = "$(symbol-event) local node running"
        initializedItem.command = "vetools.stopLocalNode"
        initializedItem.tooltip = "Stop the locally running node server"
        // Using any string other than the approved theme colors will reset the background to default.
        initializedItem.backgroundColor = new ThemeColor("reset")
        initializedItem.show()
    } else {
        initializedItem.text = "$(symbol-event) local node stopped"
        initializedItem.command = "vetools.startLocalNode"
        initializedItem.tooltip = "Start a local node at 127.0.0.1:8545"
        initializedItem.backgroundColor = new ThemeColor("statusBarItem.warningBackground")
        initializedItem.show()
    }
}
