
import { Group } from "../../models/TreeItems";
import { GroupView } from "../GroupView";
import { ViewCreator } from "./ViewCreator";

export class GroupViewCreator extends ViewCreator {
  public create(groupItem: Group): GroupView {
    return new GroupView(groupItem);
  }
}
