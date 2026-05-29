// MERCA Contract Configuration
// Chain: Morph Hoodi Testnet (2910)

export const MORPH_HOODI = {
  id: 2910,
  name: "Morph Hoodi",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc-hoodi.morph.network"] },
  },
  blockExplorers: {
    default: { name: "Morph Explorer", url: "https://explorer-hoodi.morphl2.io" },
  },
} as const;

export const CONTRACTS = {
  MERCA_INVOICE: "0xea85ae4f1b36a8d540f391d29208d750968a21a6" as `0x${string}`,
  MERCA_KYC: "0x7affF4B529C13794BF2A5Af134A2420003D5058E" as `0x${string}`,
  MERCA_WALLET: "0x5083D82F7Da5B31188c17191059956143ed1A7A0" as `0x${string}`,
  USDC: "0x7433b41C6c5e1d58D4Da99483609520255ab661B" as `0x${string}`,
} as const;

export const USDC_DECIMALS = 6;

export const INVOICE_ABI = [
  {
    name: "createInvoice",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "id", type: "bytes32" },
      { name: "customer", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "token", type: "address" },
      { name: "expiresAt", type: "uint256" },
      { name: "description", type: "string" },
    ],
    outputs: [],
  },
  {
    name: "payInvoice",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "id", type: "bytes32" }],
    outputs: [],
  },
  {
    name: "cancelInvoice",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "id", type: "bytes32" }],
    outputs: [],
  },
  {
    name: "getInvoice",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "id", type: "bytes32" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "id", type: "bytes32" },
          { name: "merchant", type: "address" },
          { name: "customer", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "token", type: "address" },
          { name: "status", type: "uint8" },
          { name: "createdAt", type: "uint256" },
          { name: "expiresAt", type: "uint256" },
          { name: "description", type: "string" },
        ],
      },
    ],
  },
  {
    name: "getMerchantInvoices",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "merchant", type: "address" }],
    outputs: [{ type: "bytes32[]" }],
  },
  {
    name: "InvoicePaid",
    type: "event",
    inputs: [
      { name: "id", type: "bytes32", indexed: true },
      { name: "payer", type: "address", indexed: true },
      { name: "merchant", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "fee", type: "uint256", indexed: false },
    ],
  },
  {
    name: "InvoiceCreated",
    type: "event",
    inputs: [
      { name: "id", type: "bytes32", indexed: true },
      { name: "merchant", type: "address", indexed: true },
      { name: "token", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "expiresAt", type: "uint256", indexed: false },
    ],
  },
] as const;

export const WALLET_ABI = [
  {
    name: "getBalance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "merchant", type: "address" },
      { name: "token", type: "address" },
      { name: "walletId", type: "uint256" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "getTotalBalance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "merchant", type: "address" },
      { name: "token", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "walletCount",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "merchant", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "withdraw",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "walletId", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "createSubWallet",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name", type: "string" },
      { name: "withdrawTo", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "subWallets",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "merchant", type: "address" },
      { name: "walletId", type: "uint256" },
    ],
    outputs: [
      { name: "name", type: "string" },
      { name: "withdrawTo", type: "address" },
      { name: "active", type: "bool" },
    ],
  },
] as const;

export const KYC_ABI = [
  {
    name: "isVerified",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "bool" }],
  },
  {
    name: "isMerchantVerified",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "bool" }],
  },
] as const;

export const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

export function formatUSDC(raw: bigint): string {
  const value = Number(raw) / 1_000_000;
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function toUSDCUnits(amount: string): bigint {
  const parsed = parseFloat(amount);
  if (isNaN(parsed)) return 0n;
  return BigInt(Math.round(parsed * 1_000_000));
}

export function generateInvoiceId(): `0x${string}` {
  const timestamp = Date.now().toString(16).padStart(16, "0");
  const random = Math.random().toString(16).slice(2).padStart(16, "0");
  return `0x${timestamp}${random}${"0".repeat(32)}`.slice(0, 66) as `0x${string}`;
}

export function dateToTimestamp(dateStr: string): bigint {
  if (!dateStr) return 0n;
  return BigInt(Math.floor(new Date(dateStr).getTime() / 1000));
}
