import { HardhatCommands } from "../../commands/HardhatCommands"

export interface IExtensionAdapter {
    validateExtension: () => Promise<void>
    build: (...args: Array<string>) => Promise<void>
    deploy: () => Promise<void>
}

export class HardhatExtensionAdapter implements IExtensionAdapter {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public async validateExtension(): Promise<void> {}

    public async build(): Promise<void> {
        return HardhatCommands.build_contracts()
    }

    public async deploy() {
        return HardhatCommands.deploy_contracts()
    }
}
