import * as outputCommandHelper from "./command"
import * as commandContext from "./commandContext"
import { required } from "./required"
import * as shell from "./shell"
import * as telemetryHelper from "./telemetry"
import { TruffleConfiguration } from "./truffleConfig"
import * as userSettings from "./userSettings"
import * as vscodeEnvironment from "./vscodeEnvironment"
import * as workspaceHelpers from "./workspace"
// export * from "./userInteraction";

const spawnProcess = outputCommandHelper.spawnProcess
const getWorkspaceRoot = workspaceHelpers.getWorkspaceRoot
const isWorkspaceOpen = workspaceHelpers.isWorkspaceOpen
const TruffleConfig = TruffleConfiguration.TruffleConfig
const CommandContext = commandContext.CommandContext
const setCommandContext = commandContext.setCommandContext

export {
    CommandContext,
    getWorkspaceRoot,
    isWorkspaceOpen,
    outputCommandHelper,
    required,
    setCommandContext,
    shell,
    spawnProcess,
    telemetryHelper,
    TruffleConfig,
    TruffleConfiguration,
    userSettings,
    vscodeEnvironment,
}
