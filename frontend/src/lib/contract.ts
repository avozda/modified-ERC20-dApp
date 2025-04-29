import BDAERC20 from "@/abi/BDAERC20.json";
import { Abi } from "viem";


const tokenABI = BDAERC20.abi as Abi;

const contractAddress: `0x${string}` = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
export default {
    address: contractAddress,
    abi: tokenABI,
    chainId: 31337,
}