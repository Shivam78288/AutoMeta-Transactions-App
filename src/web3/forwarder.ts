import { ethers } from "ethers";
import abi from "../abi/Forwarder.json";
import { Web3Provider } from "@ethersproject/providers";
import { Forwarder } from "../../typechain-types/contracts";
import addresses from "../deploy.json";

export function createForwarderInstance(provider: Web3Provider): Forwarder {
  return new ethers.Contract(addresses.Forwarder, abi, provider) as Forwarder;
}
