import { workspace } from "vscode"
import { Constants } from "../Constants"

export function get_workspace_root(ignoreException: boolean = false): string | undefined {
    const workspaceRoot = workspace.workspaceFolders && workspace.workspaceFolders[0].uri.fsPath

    console.debug("My workspace root:", workspaceRoot)

    if (workspaceRoot === undefined && !ignoreException) {
        const error = new Error(Constants.errorMessageStrings.VariableShouldBeDefined("Workspace root"))
        throw error
    }

    return workspaceRoot
}

export function isWorkspaceOpen(): boolean {
    return !!(workspace.workspaceFolders && workspace.workspaceFolders[0].uri.fsPath)
}
