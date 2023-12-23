import { IInfuraProjectDto } from "."

export interface IInfuraProjectQuickPick extends IInfuraProjectDto {
    label: string
    picked: boolean
}
