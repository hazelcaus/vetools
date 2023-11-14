import { commands, QuickPickItem, window } from "vscode"
import { Constants, RequiredApps } from "../Constants"
import { required, outputCommandHelper } from "../helpers"
import { ServerService, TreeManager } from "../services"
import { ProjectView } from "../ViewItems"

export namespace ServerCommands {
    export async function start_ganache(): Promise<void> {
        await required.install_dependencies()

        const port = Constants.default_port
        const ganache_process = await ServerService.start_ganache_server(port)

        if (!ganache_process.process) {
            // If server already running, don't do anything
            return
        }
    }

    export async function stop_ganache(): Promise<void> {
        const port = Constants.default_port
        const port_status = await ServerService.getPortStatus(port)

        if (port_status === ServerService.PortStatus.GANACHE) {
            await ServerService.stopGanacheServer(port)
        } else {
            // Don't do anything
        }
    }
}
