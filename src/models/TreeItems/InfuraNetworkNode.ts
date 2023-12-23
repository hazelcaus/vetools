import { URL } from "url"
import { Constants } from "../../Constants"
import { TruffleConfiguration } from "../../helpers"
import { showInputBox } from "../../utils/utils"
import { ItemType } from "../ItemType"
import { MnemonicNetworkNode } from "./MnemonicNetworkNode"

export class InfuraNetworkNode extends MnemonicNetworkNode {
    constructor(label: string, url: URL | string, networkId: number | string) {
        super(ItemType.INFURA_NETWORK_NODE, label, Constants.treeItemData.network.infura, url, networkId)
    }

    public async getTruffleNetwork(): Promise<TruffleConfiguration.INetwork> {
        return await super.getTruffleNetwork()
    }

    protected async getGasPrice(): Promise<number | undefined> {
        const value = await showInputBox({
            ignoreFocusOut: true,
            prompt: Constants.paletteLabels.valueOrDefault(
                Constants.propertyLabels.gasPrice,
                Constants.defaultContractSettings.gasPrice
            ),
            validateInput: this.validation,
        })

        if (!value) {
            return Constants.defaultContractSettings.gasPrice
        }

        return parseInt(value, 10)
    }

    protected async getGasLimit(): Promise<number | undefined> {
        const value = await showInputBox({
            ignoreFocusOut: true,
            prompt: Constants.paletteLabels.valueOrDefault(
                Constants.propertyLabels.gasLimit,
                Constants.defaultContractSettings.gasLimit
            ),
            validateInput: this.validation,
        })

        if (!value) {
            return Constants.defaultContractSettings.gasLimit
        }

        return parseInt(value, 10)
    }

    protected defaultProtocol(): string {
        return Constants.networkProtocols.https
    }

    private validation(value: string): string | undefined {
        return value && !value.match(new RegExp(/^\d+$/g))
            ? Constants.validationMessages.valueShouldBeNumberOrEmpty
            : undefined
    }
}
