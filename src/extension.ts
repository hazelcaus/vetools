import { commands, ExtensionContext, window } from "vscode"
import { DebuggerCommands, GanacheCommands, ProjectCommands, sdkCoreCommands, statusBarCommands } from "./commands"
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

    await required.installDependencies()

    setCommandContext(CommandContext.Enabled, true)
    setCommandContext(CommandContext.IsWorkspaceOpen, isWorkspaceOpen())

    const refresh = commands.registerCommand("vetools.refresh", (element) => {
        TreeService.refresh(element)
    })

    // Commands
    const newProject = commands.registerCommand("vetools.newProject", async () => {
        await tryExecute(() => ProjectCommands.newProject())
    })
    const buildContracts = commands.registerCommand("vetools.buildContracts", async () => {
        await tryExecute(() => sdkCoreCommands.build())
    })
    const deployContracts = commands.registerCommand("vetools.deployContracts", async () => {
        await tryExecute(() => sdkCoreCommands.deploy())
    })
    const startLocalNode = commands.registerCommand("vetools.startLocalNode", async () => {
        await tryExecute(() => statusBarCommands.startLocalNode())
    })
    const stopLocalNode = commands.registerCommand("vetools.stopLocalNode", async () => {
        await tryExecute(() => statusBarCommands.stopLocalNode())
    })
    const createWallet = commands.registerCommand("vetools.createWallet", async () => {
        await tryExecute(() => ProjectCommands.createWallet())
    })
    const transferAssets = commands.registerCommand("vetools.transferAssets", async () => {
        await tryExecute(() => ProjectCommands.transferAssets())
    })
    const get_debug_workspace_folder = commands.registerCommand("vetools.debugWorkspaceFolder", () => {
        return Constants.truffle_temp_dir
    })
    const get_provider_url = commands.registerCommand("vetools.getProviderUrl", () => {
        return Constants.provider_url
    })

    // Debugger
    const start_debugger = commands.registerCommand("vetools.debug", async () => {
        await tryExecute(() => DebuggerCommands.start_debugger())
    })

    context.subscriptions.push(
        ...[
            refresh,
            newProject,
            buildContracts,
            deployContracts,
            startLocalNode,
            stopLocalNode,
            createWallet,
            transferAssets,
            start_debugger,
            get_debug_workspace_folder,
            get_provider_url,
        ]
    )

    // Start a recurring task to keep local node status updated
    setInterval(nodeStatus, 1000)
}

export async function deactivate() {
    console.debug("DEACTIVATE CALLED")
    // This method is called when your extension is deactivated
    // To dispose of all extensions, vscode provides 5 sec.
    // Therefore, please, call important dispose functions first and don't use await
    // For more information see https://github.com/Microsoft/vscode/issues/47881
    await tryExecute(() => GanacheCommands.stop_ganache())
    GanacheService.dispose()
    Output.dispose()
}

async function tryExecute(func: () => Promise<any>, err_msg: string | null = null) {
    try {
        await func()
    } catch (error) {
        if (error instanceof CancellationEvent) {
            return
        }
        window.showErrorMessage(err_msg || (error as Error).message)
    }
}
