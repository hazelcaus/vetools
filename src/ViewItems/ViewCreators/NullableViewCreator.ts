import { Nullable } from "../../Models/TreeItems"
import { NullableView } from "../NullableView"
import { ViewCreator } from "./ViewCreator"

export class NullableViewCreator extends ViewCreator {
    public create(nullableItem: Nullable): NullableView {
        return new NullableView(nullableItem)
    }
}
