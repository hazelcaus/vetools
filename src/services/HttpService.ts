import requestPromise from "request-promise"
import { Constants } from "../Constants"

const requestTimeout = 10000

export namespace HttpService {
    export async function sendRPCRequest(
        host: string,
        methodName: string,
        parameters?: string[]
    ): Promise<{ result?: any; error?: any } | undefined> {
        const address = hasProtocol(host) ? host : `${Constants.networkProtocols.http}${host}`
        return requestPromise
            .post(address, {
                body: {
                    id: 1,
                    jsonrpc: "2.0",
                    method: methodName,
                    params: parameters || [],
                },
                json: true,
                timeout: requestTimeout,
            })
            .catch((_errorMessage) => {
                return undefined
            })
    }

    function hasProtocol(host: string): boolean {
        return (
            host.indexOf(Constants.networkProtocols.http) === 0 || host.indexOf(Constants.networkProtocols.https) === 0
        )
    }
}
