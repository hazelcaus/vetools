
import { IExtensionItem } from "../../models/TreeItems";
import { ExtensionView } from "../ExtensionView";

export abstract class ViewCreator {
  public abstract create(extensionItem: IExtensionItem): ExtensionView<IExtensionItem>;
}
