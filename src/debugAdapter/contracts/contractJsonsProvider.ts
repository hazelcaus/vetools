import fs from "fs-extra"
import path from "path"
import { CONTRACT_JSON_ENCODING } from "../constants/contractJson"
import { IContractJsonModel } from "../models/IContractJsonModel"

export class ContractJsonsProvider {
    private contracts_build_dir: string
    private contract_json_encoding: string
    private __cached_contract_jsons: { [fileName: string]: IContractJsonModel } | undefined

    constructor(contracts_build_dir: string, contract_json_encoding = "utf-8") {
        this.contracts_build_dir = contracts_build_dir
        this.contract_json_encoding = contract_json_encoding
    }

    public async get_json_contents(
        where_is_this_coming_from: string
    ): Promise<{ [fileName: string]: IContractJsonModel }> {
        if (!this.__cached_contract_jsons) {
            const does_directory_exist = fs.existsSync(this.contracts_build_dir)
            const result: { [filename: string]: IContractJsonModel } = {}
            console.debug(`[get_json_contents] coming from ${where_is_this_coming_from}`)

            if (does_directory_exist) {
                const dir = this.contracts_build_dir
                try {
                    const files = fs.readdirSync(dir)
                    console.debug(`Files found in ${dir}: ${files}`)

                    for (const file of files) {
                        if (file.toLowerCase().includes("migrations")) continue

                        const fullpath = path.join(dir, file)
                        const content = fs.readFileSync(fullpath)

                        try {
                            result[file] = JSON.parse(content.toString()) as IContractJsonModel
                            console.debug(result[file].sourcePath)
                        } catch (err) {
                            throw new Error(
                                `Error while parsing ${fullpath}. Invalid JSON file. Error: ${(
                                    err as Error
                                ).toString()}`
                            )
                        }
                    }
                } catch (err) {
                    throw new Error(`Internal error. Error reading directory ${dir}: ${(err as Error).toString()}`)
                }

                this.__cached_contract_jsons = result
            } else {
                this.__cached_contract_jsons = {}
            }
        }

        return this.__cached_contract_jsons
    }
}
