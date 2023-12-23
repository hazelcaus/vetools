import { IInfuraProjectDto } from "./IInfuraProjectDto"

export interface IProjectsResultDto {
    allowed_projects: number
    projects: IInfuraProjectDto[]
}
