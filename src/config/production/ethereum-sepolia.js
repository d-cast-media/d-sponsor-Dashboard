import Network from "../../providers/utils/networks";
import contractABI from "../../abi/dsponsorAdmin.json";

const prodEthereumSepolia = {
  chainId: 11155111,
  chainName: "sepolia",
  chainNameProvider: "sepolia",
  network: Network.ETH_SEPOLIA,
  logoURL: "/images/ethereum-logo.png",
  explorerBaseUrl: "https://sepolia.etherscan.io",

  rpcURL: "https://ethereum-sepolia-rpc.publicnode.com",
  smartContracts: {
    NATIVE: {
      address: "0x0000000000000000000000000000000000000000",
      decimals: 18,
      symbol: "ETH"
    },
    WNATIVE: {
      address: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14"
    },
    USDC: {
      address: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8"
    },
    WETH: {
      address: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14"
    },
    UNISWAP_QUOTER: {
      address: "0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3"
    },
    DSPONSORADMIN: {
      address: "0x10E0447dDB66f1d33E6b10dB5099FBa231ceCE5C",
      abi: contractABI
    },
    DSPONSORMP: {
      address: "0x0B7f100940f4152D01B42A626ab73f7A62dd7cdC"
    }
  },
  features: {
    crossmint: {
      enabled: false
    }
  }
};

export default prodEthereumSepolia;
