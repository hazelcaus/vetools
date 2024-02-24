import { commands, ExtensionContext, window } from "vscode"
import { DebuggerCommands, GanacheCommands, ProjectCommands, sdkCoreCommands, HardhatCommands, statusBarCommands } from "./commands"
import { CommandContext, isWorkspaceOpen, required, setCommandContext } from "./helpers"
import { GanacheService, MnemonicRepository, TreeService } from "./services"
import { Constants } from "./Constants"
import { CancellationEvent } from "./Models"
import { Output } from "./Output"
import { DebuggerConfiguration } from "./debugAdapter/configuration/debuggerConfiguration"
import nodeStatus from "./statusBar/nodeStatus"

export async function activate(context: ExtensionContext) {
    Constants.initialize(context)
    DebuggerConfiguration.initialize(context)
    MnemonicRepository.initialize(context.globalState)
    await sdkCoreCommands.initialize(context.globalState)
    await statusBarCommands.initialize(context.globalState)

    await required.install_dependencies()

    setCommandContext(CommandContext.Enabled, true)
    setCommandContext(CommandContext.IsWorkspaceOpen, isWorkspaceOpen())

    const refresh = commands.registerCommand("vetools.refresh", (element) => {
        TreeService.refresh(element)
    })

    // Commands
    const new_project = commands.registerCommand("vetools.newProject", async () => {
        await try_execute(() => ProjectCommands.new_project())
    })
    const buildContracts = commands.registerCommand("vetools.buildContracts", async () => {
        await try_execute(() => sdkCoreCommands.build())
    })
    const deployContracts = commands.registerCommand("vetools.deployContracts", async () => {
        await try_execute(() => sdkCoreCommands.deploy())
    })
    const startLocalNode = commands.registerCommand("vetools.startLocalNode", async () => {
        await try_execute(() => statusBarCommands.startLocalNode())
    })
    const stopLocalNode = commands.registerCommand("vetools.stopLocalNode", async () => {
        await try_execute(() => statusBarCommands.stopLocalNode())
    })
    const get_debug_workspace_folder = commands.registerCommand("vetools.debugWorkspaceFolder", () => {
        return Constants.truffle_temp_dir
    })
    const get_provider_url = commands.registerCommand("vetools.getProviderUrl", () => {
        return Constants.provider_url
    })

    // Debugger
    const start_debugger = commands.registerCommand("vetools.debug", async () => {
        await try_execute(() => DebuggerCommands.start_debugger())
    })

    const subscriptions = [
        refresh,
        new_project,
        buildContracts,
        deployContracts,
        startLocalNode,
        stopLocalNode,
        start_debugger,
        get_debug_workspace_folder,
        get_provider_url,
    ]
    context.subscriptions.push(...subscriptions)

    // Start a recurring task to keep local node status updated
    setInterval(nodeStatus, 1000)
}

export async function deactivate(): Promise<void> {
    console.debug("DEACTIVATE CALLED")
    // This method is called when your extension is deactivated
    // To dispose of all extensions, vscode provides 5 sec.
    // Therefore, please, call important dispose functions first and don't use await
    // For more information see https://github.com/Microsoft/vscode/issues/47881
    await try_execute(() => GanacheCommands.stop_ganache())
    GanacheService.dispose()
    Output.dispose()
}

async function try_execute(func: () => Promise<any>, err_msg: string | null = null): Promise<void> {
    try {
        await func()
    } catch (error) {
        if (error instanceof CancellationEvent) {
            return
        }
        window.showErrorMessage(err_msg || (error as Error).message)
    }
}
