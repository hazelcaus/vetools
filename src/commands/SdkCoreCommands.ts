import { Memento, window } from "vscode"
import { IExtensionAdapter, HardhatExtensionAdapter } from "../services/extensionAdapter"

class SdkCoreCommands {
    // @ts-ignore
    private global_state?: Memento
    private extension_adapter!: IExtensionAdapter

    public async initialize(global_state: Memento): Promise<void> {
        this.global_state = global_state

        this.extension_adapter = this.getExtensionAdapter()
        this.extension_adapter.validateExtension().catch((error) => {
            window.showErrorMessage(error.message)
        })
    }

    public async build(): Promise<void> {
        return this.extension_adapter.build()
    }

    public async deploy(): Promise<void> {
        return this.extension_adapter.deploy()
    }

    private getExtensionAdapter(): IExtensionAdapter {
        return new HardhatExtensionAdapter()
    }
}

export const sdkCoreCommands = new SdkCoreCommands()
