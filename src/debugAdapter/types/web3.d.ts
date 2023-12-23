declare module Web3 {
    interface IProvider {
        currentProvider: any
    }
    interface IBlockResponse {
        number: number
        transactions: string[]
    }
    interface ITransactionResponse {
        input: string // encoded methodName and params
    }
    interface ITransactionReceiptResponse {
        from: string
        to?: string
        contractAddress?: string
    }
    interface IBatchRequest {
        add: (request: any) => void
        execute: () => Promise<any>
    }
    interface IRequest {
        request: (...args: any[]) => any
    }

    interface IWeb3Eth extends IProvider {
        net: {
            getId: () => Promise<number>
        }
        getBlock: any
        getTransaction: any
        getTransactionReceipt: any
        getBlockNumber: any
        currentProvider: any
    }
    const providers: {
        HttpProvider: new (providerUrl: string) => IProvider
        WebsocketProvider: new (providerUrl: string) => IProvider
    }
}

// eslint-disable-next-line no-redeclare
declare class Web3 {
    constructor(provider: Web3.IProvider)
    eth: Web3.IWeb3Eth
    BatchRequest: new () => Web3.IBatchRequest
}

declare module "web3" {
    export = Web3
}
