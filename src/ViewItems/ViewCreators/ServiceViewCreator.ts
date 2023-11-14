
import { Service } from "../../models/TreeItems";
import { ServiceView } from "../ServiceView";
import { ViewCreator } from "./ViewCreator";

export class ServiceViewCreator extends ViewCreator {
  public create(serviceItem: Service): ServiceView {
    return new ServiceView(serviceItem);
  }
}
