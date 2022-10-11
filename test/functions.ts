import { ethers } from "ethers";
import { Forwarder } from "../typechain-types";
import { JsonRpcSigner, Web3Provider } from "@ethersproject/providers";
import {
  ForwardRequestType,
  FullTypedDataType,
  TypedDataType,
  TypeOfRequest,
} from "../src/types/types";

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

export const getMetaTransferFunctionSelector = () => {
  return ethers.utils.id("metaTransfer(address,address,uint256)").slice(0, 10);
};

export const getMetaTransferFromFunctionSelector = () => {
  return ethers.utils
    .id("metaTransferFrom(address,address,address,uint256)")
    .slice(0, 10);
};

export const getMetaApproveFunctionSelector = () => {
  return ethers.utils.id("metaApprove(address,address,uint256)").slice(0, 10);
};

export const metaTransferFunctionSelectorAndData = ({
  from,
  to,
  amount,
}: {
  from: string;
  to: string;
  amount: string;
}): { data: string; functionSelector: string } => {
  const abiCoder = ethers.utils.defaultAbiCoder;

  const functionSelector = getMetaTransferFunctionSelector();
  let data = abiCoder.encode(
    ["address", "address", "uint256"],
    [from, to, amount]
  );

  data = abiCoder.encode(["bytes4", "bytes"], [functionSelector, data]);

  return { data, functionSelector };
};

export const metaTransferFromFunctionSelectorAndData = ({
  caller,
  owner,
  to,
  amount,
}: {
  caller: string;
  owner: string;
  to: string;
  amount: string;
}): { data: string; functionSelector: string } => {
  const abiCoder = ethers.utils.defaultAbiCoder;
  const functionSelector = getMetaTransferFromFunctionSelector();

  let data = abiCoder.encode(
    ["address", "address", "address", "uint256"],
    [caller, owner, to, amount]
  );

  data = abiCoder.encode(["bytes4", "bytes"], [functionSelector, data]);

  return { data, functionSelector };
};

export const metaApproveFunctionSelectorAndData = ({
  owner,
  spender,
  amount,
}: {
  owner: string;
  spender: string;
  amount: string;
}): { data: string; functionSelector: string } => {
  const abiCoder = ethers.utils.defaultAbiCoder;
  const functionSelector = getMetaApproveFunctionSelector();

  let data = abiCoder.encode(
    ["address", "address", "uint256"],
    [owner, spender, amount]
  );
  data = abiCoder.encode(["bytes4", "bytes"], [functionSelector, data]);

  return { data, functionSelector };
};

export const getNonce = async (from: string, forwarder: Forwarder) => {
  let nonce = await forwarder.getNonce(from).then((nonce) => nonce.toString());
  return nonce;
};

export const getFunctionSelectorAndData = ({
  type,
  from,
  to,
  owner,
  amount,
}: {
  type: TypeOfRequest;
  from: string;
  to: string;
  owner: string;
  amount: string;
}) => {
  if (type === TypeOfRequest.MetaTransfer) {
    const { functionSelector, data } = metaTransferFunctionSelectorAndData({
      from: from,
      to: to,
      amount: amount,
    });
    return { functionSelector, data };
  } else if (type === TypeOfRequest.MetaTransferFrom) {
    if (owner === from) {
      throw new Error("Owner address not provided");
    }
    const { functionSelector, data } = metaTransferFromFunctionSelectorAndData({
      caller: from,
      owner: owner,
      to: to,
      amount: amount,
    });

    return { functionSelector, data };
  } else if (type === TypeOfRequest.MetaApprove) {
    const { functionSelector, data } = metaApproveFunctionSelectorAndData({
      owner: from,
      spender: to,
      amount: amount,
    });
    return { functionSelector, data };
  } else throw new Error("Type of request invalid");
};
