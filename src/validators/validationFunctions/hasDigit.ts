import { Constants } from "../../Constants"
import { IRule } from "../validator"

export class HasDigit implements IRule {
    public validate(value: string): string | null {
        const hasDigit = value.search(Constants.validationRegexps.hasDigits) !== -1
        return hasDigit ? null : Constants.validationMessages.noDigits
    }
}
