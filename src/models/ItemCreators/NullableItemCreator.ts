import { Nullable } from "../TreeItems"
import { ItemCreator } from "./ItemCreator"

export class NullableItemCreator extends ItemCreator {
    protected createFromObject(): Nullable {
        return new Nullable()
    }
}
