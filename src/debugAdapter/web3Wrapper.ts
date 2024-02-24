import truffleProvider from "@truffle/provider"
import Web3 from "web3"
import { ConfigurationReader } from "./configurationReader"
import { Constants } from "../Constants"

export class Web3Wrapper extends Web3 {
    private _networkId: number | undefined
    private _options: ConfigurationReader.INetworkOption
    private _cachedProvider: any

    public constructor(options?: any) {
        let network_options = options
        if (!options)
            network_options = {
                network_id: "*",
                host: Constants.default_host,
                port: +Constants.default_port,
            }

        console.log("Network options:", { network_options })

        const innerProvider = getWeb3InnerProvider(network_options)
        super(innerProvider)
        this._options = network_options
    }

    public getProvider() {
        if (!this._cachedProvider) {
            const web3Provider = this.eth.currentProvider
            const truffleProviderOptions = {
                provider: () => {
                    return web3Provider
                },
            }
            this._cachedProvider = truffleProvider.create(truffleProviderOptions)
        }

        return this._cachedProvider
    }

    public getProviderUrl() {
        const provider_url = getProviderUrl(this._options)
    }

    public async getNetworkId(): Promise<number> {
        if (!this._networkId) {
            this._networkId = await this.eth.net.getId()
            this.validateNetworkId(this._networkId)
        }

        return this._networkId
    }

    public createBatchRequest() {
        return PromiseBatch(new this.BatchRequest())
    }

    private async validateNetworkId(networkId: number) {
        const declaredNetworkId = this._options.network_id
        if (declaredNetworkId !== "*") {
            if (networkId.toString() !== declaredNetworkId.toString()) {
                const error =
                    "The network id specified in the truffle config " +
                    `(${networkId}) does not match the one returned by the network ` +
                    `(${declaredNetworkId}).    Ensure that both the network and the ` +
                    "provider are properly configured."
                throw new Error(error)
            }
        }
    }
}

function PromiseBatch(batch: Web3.IBatchRequest) {
    const _batch = batch
    const _requests: Array<Promise<any>> = []
    return {
        add(method: any, hash: string) {
            const promise = new Promise<any>((accept, reject) => {
                _batch.add(
                    method.request(hash, (error: any, result: any) => {
                        if (error) {
                            reject(error)
                        }
                        accept(result)
                    })
                )
            })
            _requests.push(promise)
        },
        async execute(): Promise<any> {
            _batch.execute()
            return Promise.all(_requests)
        },
    }
}

function getProviderUrl(options: ConfigurationReader.INetworkOption): string {
    if (options.host && options.port) {
        const protocol = options.websockets ? "ws" : "http"
        const url = `${protocol}://${options.host}:${options.port}`
        Constants.provider_url = url

        return url
    }

    throw new Error("Undefined network options.")
}

function getWeb3InnerProvider(options: ConfigurationReader.INetworkOption): Web3.IProvider {
    const providerUrl = getProviderUrl(options)

    let provider
    if (providerUrl.startsWith("ws")) {
        provider = new Web3.providers.WebsocketProvider(providerUrl)
    } else {
        provider = new Web3.providers.HttpProvider(providerUrl)
    }

    return provider
}
