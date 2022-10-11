import { ethers } from "ethers";
import { Forwarder } from "../../typechain-types";
import { ForwardRequestType, TypeOfRequest } from "../types/types";

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
  let nonce;

  const pendingRequests = await fetch("http://localhost:4000/requests", {
    method: "GET",
  });
  const pendingRequestsData = await pendingRequests.json();
  const currentUserRequests = pendingRequestsData.requests.filter(
    (request: ForwardRequestType) => request.from === from
  );

  if (currentUserRequests.length > 0) {
    nonce = (
      Number(currentUserRequests[currentUserRequests.length - 1].nonce) + 1
    ).toString();
  } else {
    nonce = await forwarder.getNonce(from).then((nonce) => nonce.toString());
  }

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
