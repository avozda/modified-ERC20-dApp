import BDAERC20 from "../../../smart-contracts/out/BDAERC20.sol/BDAERC20.json";
import { Abi } from "viem";


const tokenABI = BDAERC20.abi as Abi;

const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`;

if (!contractAddress) {
    throw new Error("CONTRACT_ADDRESS is not set in the environment variables.");
}

export default {
    address: contractAddress,
    abi: tokenABI,
    chainId: 31337,
}