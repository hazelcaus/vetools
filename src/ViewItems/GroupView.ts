import { Group } from "../Models/TreeItems/Group"
import { ExtensionView } from "./ExtensionView"

export class GroupView extends ExtensionView<Group> {
    constructor(groupItem: Group) {
        super(groupItem)
    }
}
