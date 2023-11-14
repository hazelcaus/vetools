
import { Project } from "../models/TreeItems/Project";
import { ExtensionView } from "./ExtensionView";

export class ProjectView extends ExtensionView<Project> {
  constructor(projectItem: Project) {
    super(projectItem);
  }
}
