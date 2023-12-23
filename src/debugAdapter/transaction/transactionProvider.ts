import { TRANSACTION_NUMBER_TO_SHOW } from "../constants/transaction"
import { ContractJsonsProvider } from "../contracts/contractJsonsProvider"
import { groupBy } from "../helpers"
import { IContractJsonModel } from "../models/IContractJsonModel"
import { ITransactionInputData } from "../models/ITransactionInputData"
import { ITransactionResponse } from "../models/ITransactionResponse"
import { Web3Wrapper } from "../web3Wrapper"
import { TransactionInputDataDecoder } from "./transactionInputDataDecoder"

export class TransactionProvider {
    private _web3: Web3Wrapper
    private _contracts_build_directory: string
    private _contract_jsons_provider: ContractJsonsProvider
    private _transaction_input_decoder: TransactionInputDataDecoder
    private _is__transaction_input_decoder_ready: boolean

    constructor(web3: Web3Wrapper, contracts_build_directory: string) {
        this._web3 = web3
        this._contracts_build_directory = contracts_build_directory
        this._contract_jsons_provider = new ContractJsonsProvider(contracts_build_directory)
        this._transaction_input_decoder = new TransactionInputDataDecoder()
        this._is__transaction_input_decoder_ready = false
    }

    public async get_last_transaction_hashes(take: number = TRANSACTION_NUMBER_TO_SHOW): Promise<string[]> {
        const latestBlockNumber = await this._web3.eth.getBlockNumber()
        const latestBlock = await this._web3.eth.getBlock(latestBlockNumber)

        const tx_hashes: string[] = []
        let block = latestBlock

        while (tx_hashes.length <= take && block.number > 0) {
            for (let i = 0; i < block.transactions.length && tx_hashes.length < TRANSACTION_NUMBER_TO_SHOW; i++) {
                tx_hashes.push(block.transactions[i])
            }
            block = await this._web3.eth.getBlock(block.number - 1)
        }

        return tx_hashes
    }

    public async get_transactions_info(tx_hashes: string[]): Promise<ITransactionResponse[]> {
        if (tx_hashes.length === 0) {
            return Promise.resolve([])
        }

        const batch_request = this._web3.createBatchRequest()
        tx_hashes.forEach((txHash) => {
            batch_request.add(this._web3.eth.getTransaction, txHash)
            batch_request.add(this._web3.eth.getTransactionReceipt, txHash)
        })
        const result: any[] = await batch_request.execute()
        const hashKey = "hash"

        result.forEach((txI) => (txI[hashKey] = txI[hashKey] || txI.transactionHash)) // fill hash property

        const groupsByHash = groupBy(result, hashKey)
        const promises = Object.keys(groupsByHash).map((hash) => {
            return this.build_transaction_response(hash, groupsByHash[hash])
        }, this)

        return Promise.all(promises)
    }

    private async build_transaction_response(hash: string, infos: any[]): Promise<ITransactionResponse> {
        const infoWithInput = infos.find((txInfo) => txInfo.input) || {}
        const infoWithAddress = infos.find((txInfo) => txInfo.to || txInfo.contractAddress) || {}
        const { methodName } = await this.get_decoded_transaction_input(infoWithInput.input)
        const contractName = await this.get_contract_name_by_address(
            infoWithAddress.to || infoWithAddress.contractAddress
        )

        return {
            contractName,
            hash,
            methodName,
        } as ITransactionResponse
    }

    private async get_decoded_transaction_input(input: string): Promise<ITransactionInputData> {
        await this.prepare_transaction_input_decoder()
        return this._transaction_input_decoder.decode(input)
    }

    private async get_contract_name_by_address(address?: string): Promise<string> {
        const contractJsons = await this.get_contract_jsons()
        if (!address) {
            return ""
        }

        const currentNetworkId = await this._web3.getNetworkId()
        const contractNames = Object.keys(contractJsons)

        for (const contractName of contractNames) {
            const contractJson = contractJsons[contractName]
            const networks = contractJson.networks
            if (networks) {
                const network = networks[currentNetworkId]
                if (network && network.address && network.address.toLowerCase() === address.toLowerCase()) {
                    return contractName
                }
            }
        }
        return ""
    }

    private async prepare_transaction_input_decoder(): Promise<void> {
        if (this._is__transaction_input_decoder_ready) {
            return
        }
        const contractJsons = await this.get_contract_jsons()
        Object.keys(contractJsons).forEach((file) =>
            this._transaction_input_decoder.addContractAbi(contractJsons[file].abi)
        )
        this._is__transaction_input_decoder_ready = true
    }

    private async get_contract_jsons(): Promise<{ [fileName: string]: IContractJsonModel }> {
        const filesContents = await this._contract_jsons_provider.get_json_contents(
            "TransactionProvider: get_contract_jsons"
        )
        if (Object.keys(filesContents).length === 0) {
            throw new Error(`No compiled contracts found in ${this._contracts_build_directory}`)
        }
        return filesContents
    }
}
