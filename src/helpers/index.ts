import * as outputCommandHelper from "./command"
import * as commandContext from "./commandContext"
import { required } from "./required"
import * as shell from "./shell"
import { TruffleConfiguration } from "./truffleConfig"
import * as userSettings from "./userSettings"
import * as vscodeEnvironment from "./vscodeEnvironment"
import * as workspaceHelpers from "./workspace"

const spawnProcess = outputCommandHelper.spawnProcess
const get_workspace_root = workspaceHelpers.get_workspace_root
const isWorkspaceOpen = workspaceHelpers.isWorkspaceOpen
const TruffleConfig = TruffleConfiguration.TruffleConfig
const CommandContext = commandContext.CommandContext
const setCommandContext = commandContext.setCommandContext

export {
    CommandContext,
    get_workspace_root,
    isWorkspaceOpen,
    outputCommandHelper,
    required,
    setCommandContext,
    shell,
    spawnProcess,
    TruffleConfig,
    TruffleConfiguration,
    userSettings,
    vscodeEnvironment,
}
