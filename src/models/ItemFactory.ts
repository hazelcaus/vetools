import { ItemCreator } from "./ItemCreators/ItemCreator"
import { ItemType } from "./ItemType"
import { IExtensionItem } from "./TreeItems"

export namespace ItemFactory {
    const registeredTypes: { [key: number]: ItemCreator } = {}

    export function register(type: ItemType | number, value: ItemCreator): void {
        if (registeredTypes[type]) {
            const error = new Error(`Factory already has this item type: ${type}`)
            throw error
        }

        registeredTypes[type] = value
    }

    export function create(obj: { [key: string]: any }): IExtensionItem {
        let creator = registeredTypes[obj.itemType]
        if (!creator) {
            obj = { itemType: ItemType.NULLABLE, label: obj.label }
            creator = registeredTypes[obj.itemType]
        }

        const extensionItem = creator.create(obj)
        const children = obj.children

        if (children && Array.isArray(children)) {
            const childrenItems = children.map((child) => ItemFactory.create(child))
            extensionItem.setChildren(childrenItems)
        }

        return extensionItem
    }
}
