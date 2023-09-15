export class Contract {
    public readonly abi: Array<{ [key: string]: any }>
    public readonly ast: { [key: string]: any }
    public readonly bytecode: string
    public readonly compiler: { [key: string]: any }
    public readonly contractName: string
    public readonly deployedBytecode: string
    public readonly metadata: string
    public readonly networks: { [key: string]: any }
    public readonly schemaVersion: string
    public readonly source: string
    public readonly sourcePath: string
    public readonly updatedAt: string

    constructor(contract: { [key: string]: any }) {
        this.abi = contract.abi
        this.ast = contract.ast
        this.bytecode = contract.bytecode
        this.compiler = contract.compiler
        this.contractName = contract.contractName
        this.deployedBytecode = contract.deployedBytecode
        this.metadata = contract.metadata
        this.networks = contract.networks
        this.schemaVersion = contract.schemaVersion
        this.source = contract.source
        this.sourcePath = contract.sourcePath
        this.updatedAt = contract.updatedAt
    }
}
