import { ethers } from "ethers";
import { createForwarderInstance } from "./forwarder";
import { createRecipientInstance } from "./recipient";
import { createProvider } from "./provider";
import { Forwarder, RecipientERC20 } from "../../typechain-types";
import { JsonRpcSigner, Web3Provider } from "@ethersproject/providers";
import {
  ForwardRequestType,
  FullTypedDataType,
  TypedDataType,
} from "../types/types";

export async function sendRequest(
  to: string,
  amount: string,
  recipientContractAddr: string
) {
  if (!to || !amount) throw new Error("Please provide all values");
  if (!window.ethereum) throw new Error("No wallet detected");

  const { ethereum } = window;
  await ethereum.request({ method: "eth_requestAccounts" });
  const userProvider = new ethers.providers.Web3Provider(window.ethereum);
  const provider = createProvider();
  const signer = userProvider.getSigner();

  const recipient = createRecipientInstance(
    userProvider,
    recipientContractAddr
  );

  return await sendMetaTx(recipient, provider, signer, to, amount);
}

async function sendMetaTx(
  recipient: RecipientERC20,
  provider: Web3Provider,
  signer: JsonRpcSigner,
  toUser: string,
  amount: string
) {
  const forwarder = createForwarderInstance(provider);

  const from = await signer.getAddress();

  const recipientContractAddr = recipient.address;

  const request = await signMetaTxRequest(signer, forwarder, provider, {
    tokenAddr: recipientContractAddr,
    from,
    to: toUser,
    amount,
  });

  const response = await fetch("http://localhost:4000/txRequest", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: JSON.stringify(request),
  });

  const responseData = await response.json();
  return responseData;
}

export async function signMetaTxRequest(
  signer: JsonRpcSigner,
  forwarder: Forwarder,
  provider: Web3Provider,
  input: {
    tokenAddr: string;
    from: string;
    to: string;
    amount: string;
  }
) {
  const request = await buildRequest(forwarder, input, provider);
  const toSign = await buildTypedData(forwarder, request);
  const signature = await signTypedData(signer, input.from, toSign);
  return { signature, request };
}

async function buildRequest(
  forwarder: Forwarder,
  input: {
    tokenAddr: string;
    from: string;
    to: string;
    amount: string;
  },
  provider: Web3Provider
): Promise<ForwardRequestType> {
  let nonce;

  const pendingRequests = await fetch("http://localhost:4000/requests", {
    method: "GET",
  });
  const pendingRequestsData = await pendingRequests.json();
  const currentUserRequests = pendingRequestsData.requests.filter(
    (request: ForwardRequestType) => request.from === input.from
  );

  if (currentUserRequests.length > 0) {
    nonce = (
      Number(currentUserRequests[currentUserRequests.length - 1].nonce) + 1
    ).toString();
  } else {
    nonce = await forwarder
      .getNonce(input.from)
      .then((nonce) => nonce.toString());
  }

  const expiryBlock = await provider.getBlockNumber().then((blockNumber) => {
    return (
      blockNumber + (Number(process.env.REACT_APP_EXPIRE_BLOCK) || 50)
    ).toString();
  });

  return { ...input, nonce, expiryBlock };
}

async function buildTypedData(
  forwarder: Forwarder,
  request: ForwardRequestType
) {
  const chainId = await forwarder.provider
    .getNetwork()
    .then((network) => network.chainId);
  const typeData = getMetaTxTypeData(chainId, forwarder.address);
  return { ...typeData, message: request };
}

function getMetaTxTypeData(
  chainId: number,
  forwarderAddress: string
): TypedDataType {
  // setup to use the signedTypedData function from ethereum
  const EIP712Domain = [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "verifyingContract", type: "address" },
  ];

  const ForwardRequest = [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "tokenAddr", type: "address" },
    { name: "amount", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "expiryBlock", type: "uint256" },
  ];

  return {
    types: {
      EIP712Domain,
      ForwardRequest,
    },
    domain: {
      name: "Forwarder",
      version: "0.0.1",
      chainId,
      verifyingContract: forwarderAddress,
    },
    primaryType: "ForwardRequest",
  };
}

async function signTypedData(
  signer: JsonRpcSigner,
  from: string,
  data: FullTypedDataType
): Promise<string> {
  return await signer.provider.send("eth_signTypedData_v4", [
    from,
    JSON.stringify(data),
  ]);
}

export async function sendRelayTx() {
  const response = await fetch("http://localhost:4000/relayTransaction", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const responseData = await response.json();
  return responseData;
}

export async function fetchRequests() {
  const response = await fetch("http://localhost:4000/requests", {
    method: "GET",
  });

  const responseData = await response.json();
  return responseData;
}
