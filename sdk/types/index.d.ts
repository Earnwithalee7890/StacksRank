/**
 * StacksRank SDK Type Definitions
 */

export interface ClarityTypeTags {
    INT: number;
    UINT: number;
    BUFFER: number;
    BOOL_TRUE: number;
    BOOL_FALSE: number;
    PRINCIPAL_STANDARD: number;
    PRINCIPAL_CONTRACT: number;
    RESPONSE_OK: number;
    RESPONSE_ERR: number;
    OPTIONAL_NONE: number;
    OPTIONAL_SOME: number;
    LIST: number;
    TUPLE: number;
    STRING_ASCII: number;
    STRING_UTF8: number;
}

export function encodeStringAscii(str: string): string;
export function encodeStringUtf8(str: string): string;
export function encodeUint(val: number | bigint | string): string;
export function encodeInt(val: number | bigint | string): string;
export function encodeBool(val: boolean): string;
export function encodePrincipal(address: string): string;
export function encodeBuffer(data: Uint8Array | number[]): string;

export function isValidStacksAddress(address: string): boolean;
export function isValidContractName(name: string): boolean;

export function detectWallet(): Promise<boolean>;
export function connectWallet(): Promise<string[]>;
export function callContract(options: any): Promise<any>;
export function formatAddress(address: string): string;
export function getBalance(address: string): Promise<number>;

export const CLARITY_TYPE_TAGS: ClarityTypeTags;
export const version: string;
export const name: string;
