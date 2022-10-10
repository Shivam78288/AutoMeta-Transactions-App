import { ethers } from "ethers";
import abi from "../abi/RecipientERC20.json";
import { Web3Provider } from "@ethersproject/providers";
import { RecipientERC20 } from "../../typechain-types";

export function createRecipientInstance(
  provider: Web3Provider,
  recipientContractAddr: string
): RecipientERC20 {
  return new ethers.Contract(
    recipientContractAddr,
    abi,
    provider
  ) as RecipientERC20;
}
