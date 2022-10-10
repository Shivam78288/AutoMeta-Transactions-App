import { Forwarder } from "../typechain-types";
import { JsonRpcSigner, Web3Provider } from "@ethersproject/providers";
import {
  ForwardRequestType,
  FullTypedDataType,
  TypedDataType,
} from "../src/types/types";

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
  let nonce = await forwarder
    .getNonce(input.from)
    .then((nonce) => nonce.toString());

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
