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
  TypeOfRequest,
} from "../types/types";
import {
  getFunctionSelectorAndData,
  getMetaApproveFunctionSelector,
  getMetaTransferFromFunctionSelector,
  getMetaTransferFunctionSelector,
  getNonce,
} from "./utils";

export async function sendTransferRequest(
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

  return await sendMetaTx(
    TypeOfRequest.MetaTransfer,
    recipient,
    provider,
    signer,
    to,
    amount
  );
}

export async function sendTransferFromRequest(
  owner: string,
  to: string,
  amount: string,
  recipientContractAddr: string
) {
  if (!to || !amount || !owner) throw new Error("Please provide all values");
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

  return await sendMetaTx(
    TypeOfRequest.MetaTransferFrom,
    recipient,
    provider,
    signer,
    to,
    amount,
    owner
  );
}

export async function sendAppoveRequest(
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

  return await sendMetaTx(
    TypeOfRequest.MetaApprove,
    recipient,
    provider,
    signer,
    to,
    amount
  );
}

async function sendMetaTx(
  type: TypeOfRequest,
  recipient: RecipientERC20,
  provider: Web3Provider,
  signer: JsonRpcSigner,
  toUser: string,
  amount: string,
  owner?: string
) {
  const forwarder = createForwarderInstance(provider);

  const from = await signer.getAddress();

  const recipientContractAddr = recipient.address;

  let request;

  if (type === TypeOfRequest.MetaTransferFrom) {
    if (!owner) throw new Error("Please provide all values");

    request = await signMetaTxRequest(type, signer, forwarder, provider, {
      tokenAddr: recipientContractAddr,
      owner,
      from,
      to: toUser,
      amount,
    });
  } else {
    request = await signMetaTxRequest(type, signer, forwarder, provider, {
      tokenAddr: recipientContractAddr,
      from,
      to: toUser,
      amount,
    });
  }

  const response = await fetch("http://localhost:4000/txRequest", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  const responseData = await response.json();
  return responseData;
}

export async function signMetaTxRequest(
  type: TypeOfRequest,
  signer: JsonRpcSigner,
  forwarder: Forwarder,
  provider: Web3Provider,
  input: {
    tokenAddr: string;
    from: string;
    to: string;
    amount: string;
    owner?: string;
  }
) {
  let request = await buildRequest(type, forwarder, input, provider);
  const toSign = await buildTypedData(forwarder, request);
  const signature = await signTypedData(signer, input.from, toSign);
  return { signature, request };
}

async function buildRequest(
  type: TypeOfRequest,
  forwarder: Forwarder,
  input: {
    owner?: string;
    tokenAddr: string;
    from: string;
    to: string;
    amount: string;
  },
  provider: Web3Provider
): Promise<ForwardRequestType> {
  let nonce = await getNonce(input.from, forwarder).then((nonce) =>
    nonce.toString()
  );

  const expiryBlock = await provider.getBlockNumber().then((blockNumber) => {
    return (
      blockNumber + (Number(process.env.REACT_APP_EXPIRE_BLOCK) || 50)
    ).toString();
  });

  const from = input.from;
  const tokenAddr = input.tokenAddr;

  const { data } = getFunctionSelectorAndData({
    type,
    from: input.from,
    to: input.to,
    owner: input.owner || input.from,
    amount: input.amount,
  });

  return { from, to: tokenAddr, nonce, expiryBlock, data };
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
    { name: "nonce", type: "uint256" },
    { name: "expiryBlock", type: "uint256" },
    { name: "data", type: "bytes" },
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

  if (!responseData.request) {
    return responseData;
  }

  const transferSelector = getMetaTransferFunctionSelector();
  const transferFromSelector = getMetaTransferFromFunctionSelector();
  const approveSelector = getMetaApproveFunctionSelector();

  const abiCoder = ethers.utils.defaultAbiCoder;
  console.log(`Response Data => `, responseData);
  const request = responseData.request.map((resData: any) => {
    const functionSelector = resData.data.slice(0, 10);
    const data = `0x` + resData.data.slice(194);
    let txType;

    if (
      functionSelector.toString() === transferSelector ||
      functionSelector.toString() === approveSelector
    ) {
      if (functionSelector.toString() === transferSelector) {
        txType = "Transfer";
      } else {
        txType = "Approve";
      }
      const [from, to, amount] = abiCoder.decode(
        ["address", "address", "uint256"],
        data
      );

      return {
        tokenAddr: resData.to,
        from,
        to,
        amount: parseInt(amount._hex, 16).toString(),
        txType,
      };
    } else if (functionSelector.toString() === transferFromSelector) {
      txType = "Transfer From";
      // eslint-disable-next-line
      const [from, owner, to, amount] = abiCoder.decode(
        ["address", "address", "address", "uint256"],
        data
      );

      return {
        tokenAddr: resData.to,
        from: owner,
        to,
        amount: parseInt(amount._hex, 16).toString(),
        txType,
      };
    } else {
      throw new Error("Invalid response from server");
    }
  });

  return { request: request, result: responseData.result };
}

export async function fetchRequests() {
  let response = await fetch("http://localhost:4000/requests", {
    method: "GET",
  });

  const responseData = await response.json();
  return responseData;
}
