import type { Address } from "viem";

/** Public build-time config (NEXT_PUBLIC_*), baked into the static export. */
export const config = {
  chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID || 1983),
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://rpc2testnet.qie.digital/",
  gameAddress: (process.env.NEXT_PUBLIC_GAME_ADDRESS || "") as Address,
  creditsAddress: (process.env.NEXT_PUBLIC_CREDITS_ADDRESS || "") as Address,
  fromBlock: BigInt(process.env.NEXT_PUBLIC_FROM_BLOCK || 0),
};

export const explorerUrl =
  config.chainId === 1990 ? "https://mainnet.qie.digital" : config.chainId === 1983 ? "https://testnet.qie.digital" : null;

export const networkName = config.chainId === 1990 ? "QIE Mainnet" : config.chainId === 1983 ? "QIE Testnet" : `Local chain ${config.chainId}`;
