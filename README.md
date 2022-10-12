# AutoMeta Transactions: A Batched-Meta-Transactions Project

## Overview

Meta transactions are the transactions that allow anyone to interact with the blockchain. They do not require users to have tokens to pay for the network’s services through transaction fees. This is done by decoupling the sender of a transaction and the payer of gas(relayer).

In this project, I have tried to create a system where users can create an ERC20 transaction(includes functions transfer, transferFrom and approve) request by signing a message using his/her private key and get the transaction executed by a relayer. The relayer batches all the transactions into a single transaction and executes it after each certain interval of time even if there is only one transaction. However if the gas limit required for sending the transaction exceeds a certain limit, the relayer will right away execute the transaction.

## Working

The user can select which function to call from the three functions provided (Transfer, Transfer From and Approve). The Transfer function takes the address of tokens to be transferred, the address of the recipient and the amount of tokens to be transferred in wei as arguments. The Transfer From function takes an additional argument which is the address of owner of the tokens. The Approve function takes the address of token, the address of the spender and the amount to be approved as arguments.

The user can add a transaction by filling all the arguments and sign the transaction using the Metamask wallet. EIP-712 compatible messages are being used to sign the transaction.

Once the user signs the message, it is added to pending requests on the server after initial verification. After each certain defined interval of time, the pending transactions are picked up by the relayer and are batched together into one transaction and executed.

The executeTransaction function is called on the Forwarder contract which verifies each signature along with the message and after successful verification, relays each request to the required target smart contract(RecipientERC20). The Forwarder contract also emits an event which is caught by our relayer and it contains the requests executed as well as if these were successful or not. This data is displayed in a table on the app as soon as it is returned from the blockchain.

The app also requests the server for pending requests after each certain interval of time to check the pending transactions and the estimated gas limit required to execute them in a batch. If this gas limit exceeds a certain maximum limit, the app requests the server to right away execute those requests.

## Tech Stack

- Frontend - React, TypeScript, EthersJs
- Relayer - NodeJs, ExpressJs
- Blockchain - Solidity, Hardhat, EthersJs

## Steps to install and run the project

### Clone to local

```bash
$ git clone https://github.com/Shivam78288/AutoMeta-Transactions.git
$ cd AutoMeta-Transactions
$ yarn
```

### To run hardhat tests

```bash
$  npx hardhat test
```

### Fill up the .env file

- Create a file named .env
- Add all the variables as suggested in .env.example

  - PRIVATE_KEY= Using it to deploy contracts as well as relayer
  - TESTER_ADDRESS= Using it to mint tokens to the tester
  - MUMBAI_RPC= RPC of polygon mumbai testnet can be found in their doc or other providers like Quicknode and Alchemy
  - POLYGONSCAN_API_KEY= API key for polygonscan can be found on their website.
  - MAX_GAS= Please provide value for the max amount of gas exceeding which transaction would be executed
  - REACT_APP_RELAY_INTERVAL= Interval for relaying transactions in milliseconds
  - REACT_APP_QUERY_INTERVAL= Interval for query server for requests and estimated gas in milliseconds
  - REACT_APP_EXPIRE_BLOCK= Amount of blocks after which a tx signed in a specific block cannot be executed

### Add mumbai network to metamask:

If you don't have Polygon Mumbai testnet network added to Metamask,

- Go to https://chainlist.org/
- Toggle the testnets button on top
- Search for mumbai
- Click "connect wallet"
- Click "Add to Metamask"

Now Metamask can connect to the Polygon Mumbai testnet network.

### Deploy the smart contract to Mumbai network

```bash
$  npx hardhat compile
$  npm run deploy
```

Now the Forwarder and RecipientERC20 smart contracts have been deployed to Mumbai testnet.
The addresses to these contracts can be found in src/deploy.json.

### Run the Relayer

Open another terminal window to run the server(relayer)

```bash
$  node server.js
```

### Run the app

Open another terminal window and type:

```bash
$ yarn start
```

Now the browser will open and app will start.
