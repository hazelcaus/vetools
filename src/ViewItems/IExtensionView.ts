import { ProviderResult } from "vscode"
import { IExtensionItem } from "../Models/TreeItems"

export interface IExtensionView {
    getTreeItem(): Promise<IExtensionItem> | IExtensionItem

    getChildren(): ProviderResult<IExtensionView[]>

    getParent(): ProviderResult<IExtensionView>
}
