import { DebugAdapterTracker, DebugAdapterTrackerFactory, DebugSession, ProviderResult } from "vscode"
import SolidityDebugAdapterTracker from "./debugAdapterTracker"

export default class SolidityDebugAdapterTrackerFactory implements DebugAdapterTrackerFactory {
    public createDebugAdapterTracker(session: DebugSession): ProviderResult<DebugAdapterTracker> {
        return new SolidityDebugAdapterTracker(session)
    }
}
