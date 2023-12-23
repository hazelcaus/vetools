import { ProviderResult } from "vscode"
import { IExtensionItem, Nullable } from "../Models/TreeItems"
import { IExtensionView } from "./IExtensionView"
import { ItemType } from "../Models"
import { ViewCreator } from "./ViewCreators"

export abstract class ExtensionView<T extends IExtensionItem> implements IExtensionView {
    protected constructor(public readonly extensionItem: T, protected parent?: IExtensionView | undefined | null) {}

    public getTreeItem(): Promise<T> | T {
        return this.extensionItem
    }

    public getChildren(): ProviderResult<IExtensionView[]> {
        const children = this.extensionItem.getChildren().map((item) => ViewItemFactory.create(item))
        children.forEach((child) => child.setParent(this))
        return children
    }

    public getParent(): ProviderResult<IExtensionView> {
        return this.parent
    }

    public setParent(element?: IExtensionView): Promise<void> | void {
        this.parent = element
    }
}

export namespace ViewItemFactory {
    const registeredTypes: { [key: number]: ViewCreator } = {}

    export function register(type: ItemType | number, value: ViewCreator): void {
        if (registeredTypes[type]) {
            const error = new Error(`Factory already has this item type: ${type}`)
            throw error
        }

        registeredTypes[type] = value
    }

    export function create(extensionItem: IExtensionItem): ExtensionView<IExtensionItem> {
        const creator = registeredTypes[extensionItem.itemType]
        if (!creator) {
            extensionItem = new Nullable()
        }

        return creator.create(extensionItem)
    }
}
