import { Constants } from "../Constants"
import { Validator } from "./validator"

export namespace DialogResultValidator {
    export function validateConfirmationResult(result: string): string | null {
        const validator = new Validator(result).isNotEmpty().isConfirmationValue()

        return validator.getErrors()
    }

    export function validateLocalNetworkName(result: string): string | null {
        const validator = new Validator(result)
            .isNotEmpty()
            .hasNoForbiddenChar(
                Constants.validationRegexps.forbiddenChars.networkName,
                Constants.validationMessages.forbiddenChars.networkName
            )

        return validator.getErrors()
    }
}
