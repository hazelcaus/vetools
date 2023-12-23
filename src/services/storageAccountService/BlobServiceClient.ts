import { HttpMethods, WebResource } from "ms-rest"
import requestPromise from "request-promise"
import { Constants } from "../../Constants"

class BlobClient {
    public async createBlob(
        storageAccountName: string,
        containerName: string,
        blobName: string,
        sas: string,
        body: string
    ): Promise<string> {
        const url = this.getUrl(storageAccountName, containerName, `/${blobName}`, sas)

        const httpRequest = this.getHttpRequest(url, "PUT", body, {
            "x-ms-blob-type": Constants.azureResourceExplorer.xMsBlockBlobType,
        })

        await this.sendRequest(httpRequest)

        return url
    }

    public deleteBlob(url: string): Promise<any> {
        const httpRequest = this.getHttpRequest(url, "DELETE")

        return this.sendRequest(httpRequest)
    }

    public createContainer(storageAccountName: string, containerName: string, sas: string): Promise<any> {
        const url = this.getUrl(storageAccountName, containerName, "", `restype=container&${sas}`)

        const httpRequest = this.getHttpRequest(url, "PUT")

        return this.sendRequest(httpRequest)
    }

    public getContainer(storageAccountName: string, containerName: string, sas: string): Promise<any> {
        const url = this.getUrl(storageAccountName, containerName, "", `restype=container&${sas}`)

        const httpRequest = this.getHttpRequest(url, "GET")

        return this.sendRequest(httpRequest)
    }

    private getUrl(storageAccountName: string, containerName: string, mainPartOfUrl: string, props: string): string {
        return `https://${storageAccountName}.blob.core.windows.net/${containerName}${mainPartOfUrl}?${props}`
    }

    private getHttpRequest(
        url: string,
        method: HttpMethods,
        body?: string,
        headers: { [key: string]: string } = {}
    ): WebResource {
        const httpRequest = new WebResource()

        httpRequest.method = method
        httpRequest.url = url
        httpRequest.headers = headers
        httpRequest.body = body

        return httpRequest
    }

    private async sendRequest(params: any = {}): Promise<any> {
        let responseBody
        try {
            responseBody = await requestPromise({ ...params })
        } catch (error) {
            if (!(error as Error).message.includes("ContainerNotFound")) {
            }

            throw error
        }

        // Deserialize Response
        try {
            return responseBody ? JSON.parse(responseBody) : null
        } catch (error) {
            throw new Error(`Error '${(error as Error).message}' occurred in deserialize the responseBody`)
        }
    }
}

export const BlobServiceClient = new BlobClient()
