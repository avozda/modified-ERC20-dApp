import BDAERC20 from "@/abi/BDAERC20.json";
import { Abi } from "viem";


const tokenABI = BDAERC20.abi as Abi;
const contractAddress: `0x${string}` = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export default {
    address: contractAddress,
    abi: tokenABI,
    chainId: 1_337,
}