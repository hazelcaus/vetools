import { LocalService } from "../TreeItems"
import { ItemCreator } from "./ItemCreator"

export class LocalServiceItemCreator extends ItemCreator {
    protected createFromObject(): LocalService {
        return new LocalService()
    }
}
