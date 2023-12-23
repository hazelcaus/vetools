import { Project } from "../../Models/TreeItems"
import { ProjectView } from "../ProjectView"
import { ViewCreator } from "./ViewCreator"

export class ProjectViewCreator extends ViewCreator {
    public create(projectItem: Project): ProjectView {
        return new ProjectView(projectItem)
    }
}
