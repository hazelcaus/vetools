import { Constants } from "../../Constants"
import { IRule } from "../validator"

export class IsNotEmpty implements IRule {
    public validate(name: string): string | null {
        return !!name.trim() ? null : Constants.validationMessages.valueCannotBeEmpty
    }
}
