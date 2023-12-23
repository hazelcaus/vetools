import { Constants } from "../../../Constants"
import { ItemType } from "../../ItemType"
import { ExtensionItemData } from "../ExtensionItem"
import { Group } from "../Group"

const { input, output } = Constants.treeItemData.group.bdm

export class BlockchainDataManagerInputAndOutput extends Group {
    constructor(
        itemType: ItemType.BLOCKCHAIN_DATA_MANAGER_INPUT_GROUP | ItemType.BLOCKCHAIN_DATA_MANAGER_OUTPUT_GROUP,
        label: string
    ) {
        const data: ExtensionItemData = itemType === ItemType.BLOCKCHAIN_DATA_MANAGER_INPUT_GROUP ? input : output

        super(itemType, label, data)
    }
}
