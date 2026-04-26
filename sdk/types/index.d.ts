/**
 * StacksRank SDK Types
 */

export interface WalletInfo {
    available: boolean;
    provider: string | null;
}

export interface NetworkInfo {
    coreApiUrl: string;
    chainId: number;
    networkId: number;
}

export interface ContractCall {
    contract: string;
    functionName: string;
    functionArgs?: string[];
    network?: 'mainnet' | 'testnet';
    appDetails?: object;
}

export function detectWallet(): WalletInfo;
export function connectWallet(): Promise<string>;
export function callContract(options: ContractCall): Promise<any>;
export function formatAddress(address: string, startChars?: number, endChars?: number): string;
export function getBalance(address: string, network?: 'mainnet' | 'testnet'): Promise<number>;

export function isValidAddress(address: string): boolean;
export function isValidContractId(contractId: string): boolean;
export function isPositiveNumber(value: number | string): boolean;

export const MAINNET: NetworkInfo;
export const TESTNET: NetworkInfo;
export const CONTRACTS: { [key: string]: string };

export const version: string;
export const name: string;
