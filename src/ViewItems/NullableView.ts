import { Nullable } from "../Models/TreeItems/Nullable"
import { ExtensionView } from "./ExtensionView"

export class NullableView extends ExtensionView<Nullable> {
    constructor(nullableItem: Nullable) {
        super(nullableItem)
    }
}
