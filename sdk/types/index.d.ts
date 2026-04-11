declare module '@earnwithalee/stacksrank-sdk' {
  export namespace encoding {
    function encodeStringAscii(str: string): string;
    function encodeStringUtf8(str: string): string;
    function encodeUint(val: number | bigint | string): string;
    function encodeInt(val: number | bigint | string): string;
    function encodeBool(val: boolean): string;
    function encodePrincipal(address: string): string;
    function encodeBuffer(data: Uint8Array | number[]): string;
  }

  export namespace contracts {
    const DEPLOYER: string;
    const CONTRACTS: {
      REPUTATION: string;
      SWAP: string;
      VAULT: string;
      FEB_CHECKIN: string;
      BUILDER_TOOLS: string;
      FEE_DISTRIBUTOR: string;
      STX_DISTRIBUTOR: string;
    };
    const CLARITY_CODE: Record<string, number>;
    const CLARITY_TYPES: Record<string, string>;
    const SIP010_TYPES: Record<string, string>;
    function getContractAddresses(): Record<string, string>;
  }

  export namespace wallet {
    function detectWallet(): { available: boolean; provider: string | null };
    function connectWallet(): Promise<string>;
    function callContract(options: {
      contract: string;
      functionName: string;
      functionArgs?: string[];
      network?: 'mainnet' | 'testnet';
      appDetails?: any;
    }): Promise<any>;
    function formatAddress(address: string, startChars?: number, endChars?: number): string;
  }

  export namespace api {
    function getBalance(address: string, network?: string): Promise<{ stx: number; tokens: Record<string, number> }>;
    function getTransactions(address: string, options?: { limit?: number; offset?: number; network?: string }): Promise<any[]>;
    function getAddressMempool(address: string): Promise<any[]>;
    function getTransactionStatus(txId: string, network?: string): Promise<string>;
    function readContract(
      contractAddress: string,
      contractName: string,
      functionName: string,
      args?: string[],
      sender?: string,
      network?: string
    ): Promise<any>;
    function getBlockHeight(network?: string): Promise<number>;
    function microToStx(val: number | string | bigint): number;
    function stxToMicro(val: number | string): number;
    function sanitizePrincipal(p: string): string | null;
  }

  // Top-level exports
  export function encodeStringAscii(str: string): string;
  export function encodeStringUtf8(str: string): string;
  export function encodeUint(val: number | bigint | string): string;
  export function encodeInt(val: number | bigint | string): string;
  export function encodeBool(val: boolean): string;
  export function encodePrincipal(address: string): string;
  export function encodeBuffer(data: Uint8Array | number[]): string;

  export const CONTRACTS: typeof contracts.CONTRACTS;
  export const DEPLOYER: string;
  export function getContractAddresses(): Record<string, string>;

  export function detectWallet(): { available: boolean; provider: string | null };
  export function connectWallet(): Promise<string>;
  export function callContract(options: {
    contract: string;
    functionName: string;
    functionArgs?: string[];
    network?: 'mainnet' | 'testnet';
    appDetails?: any;
  }): Promise<any>;
  export function formatAddress(address: string, startChars?: number, endChars?: number): string;

  export function getBalance(address: string, network?: string): Promise<{ stx: number; tokens: Record<string, number> }>;
  export function getTransactions(address: string, options?: { limit?: number; offset?: number; network?: string }): Promise<any[]>;
  export function getTransactionStatus(txId: string, network?: string): Promise<string>;
  export function readContract(
    contractAddress: string,
    contractName: string,
    functionName: string,
    args?: string[],
    sender?: string,
    network?: string
  ): Promise<any>;
  export function getBlockHeight(network?: string): Promise<number>;
  export function microToStx(val: number | string | bigint): number;
  export function stxToMicro(val: number | string): number;
}
