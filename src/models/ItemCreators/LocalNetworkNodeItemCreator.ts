import { LocalNetworkNode } from "../TreeItems"
import { NetworkNodeItemCreator } from "./NetworkNodeItemCreator"

export class LocalNetworkNodeItemCreator extends NetworkNodeItemCreator {
    protected createFromObject(label: string, url: string, networkId: string): LocalNetworkNode {
        return new LocalNetworkNode(label, url, networkId)
    }
}
