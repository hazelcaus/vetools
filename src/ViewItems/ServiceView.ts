
import { Service } from "../models/TreeItems";
import { ExtensionView } from "./ExtensionView";

export class ServiceView extends ExtensionView<Service> {
  constructor(serviceItem: Service) {
    super(serviceItem);
  }
}
