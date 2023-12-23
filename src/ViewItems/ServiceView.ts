import { Service } from "../Models/TreeItems"
import { ExtensionView } from "./ExtensionView"

export class ServiceView extends ExtensionView<Service> {
    constructor(serviceItem: Service) {
        super(serviceItem)
    }
}
