import { InfuraService } from "../TreeItems"
import { ItemCreator } from "./ItemCreator"

export class InfuraServiceItemCreator extends ItemCreator {
    protected createFromObject(): InfuraService {
        return new InfuraService()
    }
}
