import { ItemType } from "../ItemType"
import { ExtensionItem, ExtensionItemData } from "./ExtensionItem"

export class Nullable extends ExtensionItem {
    constructor() {
        super(ItemType.NULLABLE, "", {} as ExtensionItemData)
    }
}
