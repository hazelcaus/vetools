import { ChildProcess, fork, ForkOptions, spawn, SpawnOptions } from "child_process"
import { tmpdir } from "os"
import { Constants } from "../Constants"
import { Output } from "../Output"

interface IForkMessage {
    command: string
    message?: string
    batch?: {
        index: number
        done: boolean
        message: string
    }
}

export interface ICommandResult {
    code: number
    cmdOutput: string
    cmdOutputIncludingStderr: string
    messages?: Array<{ [key: string]: any }>
}

export interface ICommandExecute {
    childProcess: ChildProcess
    result: Promise<ICommandResult>
}

export async function execute(
    workingDirectory: string | undefined,
    commands: string,
    ...args: string[]
): Promise<string> {
    Output.output_line(
        "vetools",
        "\n" +
            `Working dir: ${workingDirectory}\n` +
            `${Constants.executeCommandMessage.runningCommand}\n` +
            `${[commands, ...args].join(" ")}`
    )

    const result: ICommandResult = await try_execute(workingDirectory, commands, ...args)

    Output.output_line("vetools", Constants.executeCommandMessage.finishRunningCommand)

    if (result.code !== 0) {
        throw new Error(Constants.executeCommandMessage.failedToRunCommand(commands.concat(" ", ...args.join(" "))))
    }

    return result.cmdOutput
}

export function spawnProcess(workingDirectory: string | undefined, commands: string, args: string[]): ChildProcess {
    const options: SpawnOptions = { cwd: workingDirectory || tmpdir(), shell: true }
    return spawn(commands, args, options)
}

export async function try_execute(
    workingDirectory: string | undefined,
    commands: string,
    ...args: string[]
): Promise<ICommandResult> {
    Output.output_line("\ntry_execute ", `workingDirectory: ${workingDirectory}\ncommands: ${commands}\nargs: ${args}\n`)
    const { result } = await tryExecuteCommandAsync(workingDirectory, true, commands, ...args)

    return result
}

export async function tryExecuteCommandAsync(
    workingDirectory: string | undefined,
    writeToOutputChannel: boolean,
    commands: string,
    ...args: string[]
): Promise<ICommandExecute> {
    let cmdOutput: string = ""
    let cmdOutputIncludingStderr: string = ""

    const childProcess = spawnProcess(workingDirectory, commands, args)
    const result = new Promise((resolve: (res: any) => void, reject: (error: Error) => void): void => {
        childProcess.stdout!.on("data", (data: string | Buffer) => {
            data = data.toString()
            cmdOutput = cmdOutput.concat(data)
            cmdOutputIncludingStderr = cmdOutputIncludingStderr.concat(data)

            if (writeToOutputChannel) {
                Output.output("vetools", data)
            }
        })

        childProcess.stderr!.on("data", (data: string | Buffer) => {
            data = data.toString()
            cmdOutputIncludingStderr = cmdOutputIncludingStderr.concat(data)
            if (writeToOutputChannel) {
                Output.output("vetools", data)
            }
        })

        childProcess.on("error", reject)
        childProcess.on("exit", (code: number) => {
            resolve({ cmdOutput, cmdOutputIncludingStderr, code })
        })
    })

    return {
        childProcess,
        result,
    }
}

export async function executeCommandInFork(
    workingDirectory: string | undefined,
    modulePath: string,
    ...args: string[]
): Promise<string> {
    Output.output_line(
        "vetools",
        "\n" +
            `Working dir: ${workingDirectory}\n` +
            `${Constants.executeCommandMessage.forkingModule}\n` +
            `${[modulePath, ...args].join(" ")}`
    )

    const result: ICommandResult = await try_execute_in_fork(workingDirectory, modulePath, ...args)

    if (result.code !== 0) {
        throw new Error(Constants.executeCommandMessage.failedToRunScript(modulePath))
    }

    return result.cmdOutput
}

export function forkProcess(workingDirectory: string | undefined, modulePath: string, args: string[]): ChildProcess {
    const options: ForkOptions = { cwd: workingDirectory || tmpdir(), silent: true, env: {}, execArgv: [] }
    return fork(modulePath, args, options)
}

export async function try_execute_in_fork(
    workingDirectory: string | undefined,
    modulePath: string,
    ...args: string[]
): Promise<ICommandResult> {
    const { result } = tryExecuteCommandInForkAsync(workingDirectory, false, modulePath, ...args)

    return result
}

export function tryExecuteCommandInForkAsync(
    workingDirectory: string | undefined,
    writeToOutputChannel: boolean,
    modulePath: string,
    ...args: string[]
): ICommandExecute {
    let cmdOutput: string = ""
    let cmdOutputIncludingStderr: string = ""
    const messages: Array<string | object> = []
    const batches: { [key: string]: string[] } = {}

    const childProcess = forkProcess(workingDirectory, modulePath, args)
    const result = new Promise((resolve: (res: any) => void, reject: (error: Error) => void): void => {
        childProcess.stdout!.on("data", (data: string | Buffer) => {
            data = data.toString()
            cmdOutput = cmdOutput.concat(data)
            cmdOutputIncludingStderr = cmdOutputIncludingStderr.concat(data)

            if (writeToOutputChannel) {
                Output.output("vetools", data)
            }
        })

        childProcess.stderr!.on("data", (data: string | Buffer) => {
            data = data.toString()
            cmdOutputIncludingStderr = cmdOutputIncludingStderr.concat(data)

            if (writeToOutputChannel) {
                Output.output("vetools", data)
            }
        })

        childProcess.on("message", (message: IForkMessage) => {
            if (message.batch) {
                batches[message.command] = batches[message.command] || []
                batches[message.command][message.batch.index] = message.batch.message
                if (message.batch.done) {
                    messages.push({ command: message.command, message: batches[message.command].join("") })
                }
            } else {
                messages.push(message)
            }

            const data = JSON.stringify(message)
            cmdOutput = cmdOutput.concat(data)
            cmdOutputIncludingStderr = cmdOutputIncludingStderr.concat(data)

            if (writeToOutputChannel) {
                Output.output("vetools", data)
            }
        })

        childProcess.on("error", reject)
        childProcess.on("close", (code: number) => {
            resolve({ cmdOutput, cmdOutputIncludingStderr, code, messages })
        })
    })

    return { childProcess, result }
}

export async function awaiter<T>(
    action: () => Promise<any>,
    stateRequest: () => Promise<T>,
    isRequestProcessing: (entity: T) => boolean,
    callback: (entity: T) => Promise<any>,
    interval: number
): Promise<any> {
    let entity: T | null = null
    await action()

    do {
        if (entity) {
            await new Promise((resolve) => setTimeout(resolve, interval))
        }

        let retry = 3

        while (true) {
            try {
                entity = await stateRequest()
                break
            } catch (error) {
                if (retry < 0) {
                    throw error
                }
                retry--
            }
        }
    } while (isRequestProcessing(entity))

    await callback(entity)
}
