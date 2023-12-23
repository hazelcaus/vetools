import { ItemType } from "../ItemType"
import { Service } from "./Service"

export class Command extends Service {
    constructor(label: string, commandName: string, args?: any[]) {
        super(ItemType.COMMAND, `-> ${label}`, {})

        this.command = {
            arguments: args,
            command: commandName,
            title: `-> ${label}`,
        }
    }
}
