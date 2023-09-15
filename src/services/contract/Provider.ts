export interface HttpHeader {
    name: string
    value: string
}

export interface ProviderOptions {
    host?: string
    protocol?: string
    timeout?: number
    headers?: HttpHeader[]
    withCredentials?: boolean
    mnemonic?: string
}

export interface Provider {
    host: string
    options?: ProviderOptions
}
