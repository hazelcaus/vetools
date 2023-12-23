import { TreeItem } from "vscode"
import { ItemType } from "../ItemType"

export interface IExtensionItem extends TreeItem {
    itemType: ItemType

    getParent(): IExtensionItem | null
    getChildren(): IExtensionItem[]
    addParent(parent: IExtensionItem): void
    addChild(child: IExtensionItem): void
    removeChild(child: IExtensionItem): void
    setChildren(children: IExtensionItem[]): void
    toJSON(): { [key: string]: any }
}
