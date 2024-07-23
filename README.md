# VeTools - VeChain VSCode Toolkit

# VeChain Grant Program

### Milestone 1 - complete

-   Boilerplate generation code ✅
-   Integration of the Solidity compiler ✅
-   Comprehensive Unit Testing ✅

### Milestone 2 - complete

-   Contract deployment module ✅
-   Local Blockchain Instance Manager ✅

### Milestone 3 - complete

-   Wallet Manager ✅
-   Asset transfer module ✅
-   Blockchain explorer ✅

# Installing

1. Search [VeTools on the VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=magnusekstrom.vetools)
2. Launch VS Code Quick Open (Ctrl+P) and paste the following command: `ext install magnusekstrom.vetools`

# Features:

## 1. Create a new Project

Similar to [create-react-app](https://create-react-app.dev/) for React, this feature offers a familiar playing ground for users familiar with Ethereum and EVM-based blockchains. This effectively creates a project structure to allow users to develop smart contracts, aid in the compilation and deployment of these contracts, and allow a seamless debugging experience.

![1. Create a new project](https://raw.githubusercontent.com/hazelcaus/vetools/dev/demo/one.gif)

To follow:

1. `Ctrl/Cmd + Shift + P` to open VSCode's Command Palette
2. Type: `VeTools: New Project`
3. Voila!

## 2. Compile your Smart Contracts

Following this directory structure, you can compile your smart contract(s) with ease.

![2. Compile your contracts](https://raw.githubusercontent.com/hazelcaus/vetools/dev/demo/vetools-compile-contracts.gif)

To follow:

1. `Ctrl/Cmd + Shift + P` to open VSCode's Command Palette
2. Type: `VeTools: Compile Contracts`
3. Enter!

or,

simply right-click on a Solidity (`.sol`) file and click `Compile Contracts`.

## 3. Create a Wallet

Create a local, temporary wallet for you to use

![3. Create a Wallet](https://raw.githubusercontent.com/hazelcaus/vetools/dev/demo/vetools-create-wallet.gif)

To follow:

1. `Ctrl/Cmd + Shift + P` to open VSCode's Command Palette
2. Type: `VeTools: Create Wallet`
3. Enter a name & password for your wallet (the password encrypts your private key)
4. Your _encrypted_ wallet is stored within the `wallets` folder of your current directory

## 4. Start/Stop Local Blockchain node

Manage local blockchain instances for testing!

![4. Start/Stop Local Blockchain node](https://raw.githubusercontent.com/hazelcaus/vetools/dev/demo/vetools-stop-start-local-node.gif)

To follow:

1. `Ctrl/Cmd + Shift + P` to open VSCode's Command Palette
2. Type: `VeTools: Start Local Node` (you can also click the orange `local node stopped` tab on the bottom-left of your VSCode window)
3. A local blockchain node is spun up!
4. To close: type `VeTools: Stop Local Node`. You can also click the `local node running` tab on the bottom-left of your VSCode window

## 5. Deploy your Smart Contracts

Deploy your smart contract(s) with ease using the created wallets above

![5. Deploy your Smart Contracts](https://raw.githubusercontent.com/hazelcaus/vetools/dev/demo/vetools-deploy-contracts.gif)

To follow:

1. `Ctrl/Cmd + Shift + P` to open VSCode's Command Palette
2. Type: `VeTools: Deploy Contracts`
3. Select a wallet you'd like to deploy the contract using
4. You may be prompted to enter a password to decrypt the wallet
5. Choose a network to deploy to
6. That's it!

Pro tip: if you're deploying to a local node, we automatically fund your address with some ETH for you to be able to deploy the contract

## 6. Transfer Assets

You can very quickly transfer assets between your created wallets (requirement: you must have at least two created wallets prior to executing this operation).

![6. Transfer Assets](https://raw.githubusercontent.com/hazelcaus/vetools/dev/demo/vetools-transfer-assets.gif)

To follow:

1. `Ctrl/Cmd + Shift + P` to open VSCode's Command Palette
2. Type: `VeTools: Transfer Assets`
3. Choose the network you'd like to execute the transfer operations on (this helps us query balances easily)
4. Select the wallet you'd like to send assets _from_
5. Select the wallet you'd like to send assets _to_
6. Enter the amount of assets you'd like to send
7. Enter the password of the _from_ wallet to decrypt it
8. Wait a while, and you'll get a confirmation when your assets are transferred. Ezpz

If that sounds like a lot, don't worry! It really isn't. Watch our quick video to help you out!
