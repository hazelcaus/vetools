import { commands, ExtensionContext, window } from "vscode"
import { ProjectCommands, sdkCoreCommands } from "./commands"
import { CommandContext, isWorkspaceOpen, required, setCommandContext } from "./helpers"
import { MnemonicRepository } from "./services"
import { Constants } from "./Constants"
import { Output } from "./Output"

export async function activate(context: ExtensionContext) {
    Constants.initialize(context)
    MnemonicRepository.initialize(context.globalState)
    await sdkCoreCommands.initialize(context.globalState)

    await required.install_dependencies()

    setCommandContext(CommandContext.Enabled, true)
    setCommandContext(CommandContext.IsWorkspaceOpen, isWorkspaceOpen())

    // Commands
    const new_project = commands.registerCommand("vetools.newProject", async () => {
        await try_execute(() => ProjectCommands.new_project())
    })

    const buildContracts = commands.registerCommand("vetools.buildContracts", async () => {
        await try_execute(() => sdkCoreCommands.build())
    })

    const subscriptions = [new_project, buildContracts]
    context.subscriptions.push(...subscriptions)
}

export async function deactivate(): Promise<void> {
    // This method is called when your extension is deactivated
    // To dispose of all extensions, vscode provides 5 sec.
    // Therefore, please, call important dispose functions first and don't use await
    // For more information see https://github.com/Microsoft/vscode/issues/47881
    Output.dispose()
}

async function try_execute(func: () => Promise<any>, err_msg: string | null = null): Promise<void> {
    try {
        await func()
    } catch (error) {
        window.showErrorMessage(err_msg || (error as Error).message)
    }
}
