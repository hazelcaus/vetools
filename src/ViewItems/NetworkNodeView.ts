import { NetworkNode } from "../Models/TreeItems"
import { ExtensionView } from "./ExtensionView"

export class NetworkNodeView extends ExtensionView<NetworkNode> {
    constructor(networkNode: NetworkNode) {
        super(networkNode)
    }
}
