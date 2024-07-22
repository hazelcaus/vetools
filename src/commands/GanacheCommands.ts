import { commands, QuickPickItem, window } from "vscode"
import { Constants, RequiredApps } from "../Constants"
import { required, outputCommandHelper } from "../helpers"
import { GanacheService, TreeManager } from "../services"
import { ProjectView } from "../ViewItems"

export namespace GanacheCommands {
    export async function start_ganache() {
        await required.installDependencies()

        const port = Constants.default_port
        const ganache_process = await GanacheService.start_ganache_server(port)

        if (!ganache_process.process) {
            // If server already running, don't do anything
            return
        }
    }

    export async function stop_ganache() {
        const port = Constants.default_port
        const port_status = await GanacheService.getPortStatus(port)

        if (port_status === GanacheService.PortStatus.GANACHE) {
            await GanacheService.stopGanacheServer(port)
        } else {
            // Don't do anything
        }
    }
}
