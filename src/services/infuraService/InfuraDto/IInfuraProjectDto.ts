import { IInfuraEndpointDto } from "./IInfuraEndpointDto"

export interface IInfuraProjectDto {
    id: string
    private: string
    private_only: boolean
    addresses: []
    origins: []
    user_agents: []
    name: string
    status: number
    created: number
    updated: number
    endpoints: IInfuraEndpointDto
}
