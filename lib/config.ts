import type { Address } from "viem";

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 1983);

// Every RPC that answered on 25 Oct 2026; the client fails over in this order.
const DEFAULT_RPCS: Record<number, string[]> = {
  1990: [1, 2, 3, 4, 5].map((n) => `https://rpc${n}mainnet.qie.digital`),
  1983: [2, 4, 5].map((n) => `https://rpc${n}testnet.qie.digital/`),
};

/** Public build-time config (NEXT_PUBLIC_*), baked into the static export. */
export const config = {
  chainId,
  /** NEXT_PUBLIC_RPC_URL may list several URLs separated by commas. */
  rpcUrls: process.env.NEXT_PUBLIC_RPC_URL ? process.env.NEXT_PUBLIC_RPC_URL.split(",").map((u) => u.trim()) : (DEFAULT_RPCS[chainId] ?? []),
  gameAddress: (process.env.NEXT_PUBLIC_GAME_ADDRESS || "") as Address,
  creditsAddress: (process.env.NEXT_PUBLIC_CREDITS_ADDRESS || "") as Address,
  fromBlock: BigInt(process.env.NEXT_PUBLIC_FROM_BLOCK || 0),
};

export const explorerUrl =
  config.chainId === 1990 ? "https://mainnet.qie.digital" : config.chainId === 1983 ? "https://testnet.qie.digital" : null;

export const networkName = config.chainId === 1990 ? "QIE Mainnet" : config.chainId === 1983 ? "QIE Testnet" : `Local chain ${config.chainId}`;
