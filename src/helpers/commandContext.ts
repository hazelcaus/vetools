import { commands } from "vscode"

export enum VSCommands {
    SetContext = "setContext",
}

export enum CommandContext {
    Enabled = "vetools:enabled",
    IsGanacheRunning = "vetools:isGanacheRunning",
    IsWorkspaceOpen = "vetools:isWorkspaceOpen",
}

export function setCommandContext(key: CommandContext | string, value: boolean): Thenable<boolean | undefined> {
    return commands.executeCommand<boolean>(VSCommands.SetContext, key, value)
}
