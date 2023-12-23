import { ChildProcess } from "child_process"
import { OutputChannel, window } from "vscode"
import { Constants, RequiredApps } from "../../Constants"
import { shell, spawnProcess } from "../../helpers"
import { findPid, killPid } from "../../helpers/shell"
import { UrlValidator } from "../../validators/UrlValidator"
import { isGanacheServer, waitGanacheStarted } from "./GanacheServiceClient"

export namespace GanacheService {
    export interface IGanacheProcess {
        output?: OutputChannel
        pid?: number
        port: number | string
        process?: ChildProcess
    }

    export const ganache_processes: { [port: string]: IGanacheProcess } = {}

    export enum PortStatus {
        FREE = 0,
        GANACHE = 1,
        NOT_GANACHE = 2,
    }

    export async function getPortStatus(port: number | string): Promise<PortStatus> {
        if (!isNaN(await shell.findPid(port))) {
            if (await isGanacheServer(port)) {
                return PortStatus.GANACHE
            } else {
                return PortStatus.NOT_GANACHE
            }
        }

        return PortStatus.FREE
    }

    export async function start_ganache_server(port: number | string): Promise<IGanacheProcess> {
        if (UrlValidator.validatePort(port)) {
            throw new Error(`${Constants.ganacheCommandStrings.invalidGanachePort}: ${port}.`)
        }

        const portStatus = await getPortStatus(port)
        if (portStatus === PortStatus.NOT_GANACHE) {
            throw new Error(`Unable to start. Port ${port} is busy.`)
        }

        if (portStatus === PortStatus.GANACHE) {
            const pid = await findPid(port)
            ganache_processes[port] = { pid, port }
        }

        if (portStatus === PortStatus.FREE) {
            ganache_processes[port] = await spawnGanacheServer(port)
        }

        return ganache_processes[port]
    }

    export async function stopGanacheServer(port: number | string, kill_out_of_band: boolean = true): Promise<void> {
        return stopGanacheProcess(ganache_processes[port], kill_out_of_band)
    }

    export function getPortFromUrl(url: string): string {
        const result = url.match(/(:\d{2,4})/)
        return result ? result[0].slice(1) : Constants.defaultLocalhostPort.toString()
    }

    export async function dispose(): Promise<void> {
        const shouldBeFree = Object.values(ganache_processes).map((ganache_process) =>
            stopGanacheProcess(ganache_process, false)
        )
        return Promise.all(shouldBeFree).then(() => undefined)
    }

    async function spawnGanacheServer(port: number | string): Promise<IGanacheProcess> {
        const process = spawnProcess(undefined, "npx", [RequiredApps.ganache, `-p ${port}`])
        const output = window.createOutputChannel(`${Constants.outputChannel.ganacheCommands}:${port}`)
        const ganache_process = { port, process, output } as IGanacheProcess

        try {
            addAllListeners(output, port, process)
            await waitGanacheStarted(port, Constants.ganacheRetryAttempts)
            ganache_process.pid = await findPid(port)
        } catch (error) {
            await stopGanacheProcess(ganache_process, true)
            throw error
        }

        return ganache_process
    }

    async function stopGanacheProcess(ganache_process: IGanacheProcess, kill_out_of_band: boolean): Promise<void> {
        if (!ganache_process) return

        const { output, pid, port, process } = ganache_process
        delete ganache_processes[port]

        if (process) {
            removeAllListeners(process)
            process.kill("SIGINT")
        }

        if (output) {
            output.dispose()
        }

        if (pid && (kill_out_of_band ? true : !!process)) {
            return killPid(pid)
        }
    }

    function addAllListeners(output: OutputChannel, port: number | string, process: ChildProcess): void {
        process.stdout!.on("data", (data: string | Buffer) => {
            output.appendLine(data.toString())
        })

        process.stderr!.on("data", (data: string | Buffer) => {
            output.appendLine(data.toString())
        })

        process.on("exit", () => {
            stopGanacheServer(port)
        })
    }

    function removeAllListeners(process: ChildProcess): void {
        process.stdout!.removeAllListeners()
        process.stderr!.removeAllListeners()
        process.removeAllListeners()
    }
}
