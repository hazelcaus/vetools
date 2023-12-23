import { sortFilePaths } from "../helpers"
import { IContractJsonModel } from "../models/IContractJsonModel"
import { IContractModel } from "../models/IContractModel"
import { Web3Wrapper } from "../web3Wrapper"
import { ContractJsonsProvider } from "./contractJsonsProvider"
import { Constants } from "../../Constants"
import path from "path"
import fs from "fs"

export type ContractData = {
    contracts: Array<any>
    files: Array<string>
    provider: any
    resolved: Array<any>
    lookupMap: Map<string, string>
}

export async function prepare_contracts(working_directory: any): Promise<ContractData> {
    console.debug("Entered prepare_contracts")
    const contracts_build_directory = Constants.truffle_config.contracts_build_directory
    const web3 = new Web3Wrapper()

    const provider = web3.getProvider()
    console.debug("GOT PROVIDER:", provider)
    const network_id = await web3.getNetworkId()
    console.debug("GOT network_id:", network_id)

    const contract_jsons = await new ContractJsonsProvider(contracts_build_directory).get_json_contents(
        "prepare_contracts"
    )
    const contract_json_values = Object.values(contract_jsons)
    const contracts = contract_json_values.map((contract_json) => mapToContractModel(contract_json, network_id))

    const unique_source_paths = contract_json_values
        .map((contract_json) => contract_json.sourcePath)
        .filter((value: any, index: number, self: any[]) => {
            return self.indexOf(value) === index
        })
    console.debug("unique_source_paths:", unique_source_paths)
    const sorted_source_paths = sortFilePaths(unique_source_paths)
    console.debug("sorted_source_paths:", sorted_source_paths)

    // our adapted one. will output the actual directory of the file v's the vanity URL/FilePath
    const resolver = new NPMExtendedResolver(working_directory)
    const resolved: SourceResolution[] = await Promise.all(
        sorted_source_paths.map(async (path: string) => await resolver.resolve(path, working_directory))
    )

    // only way to filter out undefined values
    const lookupMap = new Map<string, string>()
    for (const r of resolved) {
        if (r.body && r.filePath && r.absPath) {
            lookupMap.set(r.filePath, r.absPath)
        }
    }

    return {
        contracts,
        files: sorted_source_paths,
        provider,
        resolved,
        lookupMap,
    }
}

export function filter_contracts_with_addresses(contracts: IContractModel[]): IContractModel[] {
    return contracts.filter((c) => c.address)
}

function mapToContractModel(contract_json: IContractJsonModel, network_id: number): IContractModel {
    return {
        address: contract_json.networks[network_id] && contract_json.networks[network_id].address,
        binary: contract_json.bytecode,
        deployedBinary: contract_json.deployedBytecode,
        ...contract_json,
    } as IContractModel
}

export interface SourceResolution {
    body: string | undefined
    filePath: string | undefined
    absPath: string | undefined
}

export class NPMExtendedResolver {
    working_directory: string

    constructor(working_directory: string) {
        this.working_directory = working_directory
    }

    async resolve(import_path: string, _imported_from: string): Promise<SourceResolution> {
        // If nothing's found, body returns `undefined`
        var body: string | undefined
        var modulesDir = this.working_directory
        var expected_path: string | undefined

        while (true) {
            expected_path = path.join(modulesDir, "node_modules", import_path)

            try {
                body = fs.readFileSync(expected_path, { encoding: "utf8" })
                break
            } catch (err) {}

            // Recurse outwards until impossible
            var oldModulesDir = modulesDir
            modulesDir = path.join(modulesDir, "..")
            if (modulesDir === oldModulesDir) {
                break
            }
        }
        return {
            body,
            filePath: import_path,
            absPath: expected_path,
        }
    }
}
