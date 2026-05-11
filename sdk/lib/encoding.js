/**
 * StacksRank SDK - Clarity Value Encoding Utilities
 * 
 * This module provides a pure JavaScript implementation for encoding common Clarity 
 * data types into their hexadecimal representation, as used in the Stacks blockchain.
 * 
 * These functions are designed to be lightweight and have zero external dependencies,
 * making them suitable for both browser and Node.js environments.
 * 
 * Supported Types:
 * - String (ASCII & UTF-8)
 * - Integers (Unsigned & Signed 128-bit)
 * - Boolean
 * - Principals (Standard Stacks addresses)
 * - Buffers
 * 
 * @module Encoding
 */

const { CLARITY_TYPE_TAGS } = require('./constants');

/**
 * Encode a Clarity string-ascii value to hex.
 * Format: 0x0d (type tag) + 4-byte big-endian length + UTF-8 bytes
 * 
 * @example
 * encodeStringAscii("hello") // Returns "0d0000000568656c6c6f"
 * 
 * @param {string} str - The ASCII string to encode
 * @throws {Error} If the input is not a string
 * @returns {string} Hex-encoded Clarity value
 */
function encodeStringAscii(str) {
    if (typeof str !== 'string') throw new Error('encodeStringAscii expects a string');
    const bytes = new TextEncoder().encode(str);
    const len = bytes.length;
    const buf = new Uint8Array(5 + len);
    buf[0] = CLARITY_TYPE_TAGS.STRING_ASCII;
    buf[1] = (len >> 24) & 0xff;
    buf[2] = (len >> 16) & 0xff;
    buf[3] = (len >> 8) & 0xff;
    buf[4] = len & 0xff;
    buf.set(bytes, 5);
    return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Encode a Clarity string-utf8 value to hex.
 * Format: 0x0e (type tag) + 4-byte big-endian length + UTF-8 bytes
 * 
 * @param {string} str - The UTF-8 string to encode
 * @throws {Error} If the input is not a string
 * @returns {string} Hex-encoded Clarity value
 */
function encodeStringUtf8(str) {
    if (typeof str !== 'string') throw new Error('encodeStringUtf8 expects a string');
    const bytes = new TextEncoder().encode(str);
    const len = bytes.length;
    const buf = new Uint8Array(5 + len);
    buf[0] = CLARITY_TYPE_TAGS.STRING_UTF8;
    buf[1] = (len >> 24) & 0xff;
    buf[2] = (len >> 16) & 0xff;
    buf[3] = (len >> 8) & 0xff;
    buf[4] = len & 0xff;
    buf.set(bytes, 5);
    return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Encode a Clarity uint128 value to hex.
 * Format: 0x01 (type tag) + 16-byte big-endian uint128
 * 
 * @param {number|bigint|string} val - The unsigned integer to encode
 * @throws {Error} If the input is negative
 * @returns {string} Hex-encoded Clarity value
 */
function encodeUint(val) {
    let n = BigInt(val);
    if (n < 0n) throw new Error('encodeUint expects a non-negative value');
    const buf = new Uint8Array(17);
    buf[0] = CLARITY_TYPE_TAGS.UINT;
    for (let i = 16; i >= 1; i--) {
        buf[i] = Number(n & 0xffn);
        n >>= 8n;
    }
    return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Encode a Clarity int128 value to hex.
 * Format: 0x00 (type tag) + 16-byte big-endian int128 (two's complement)
 * 
 * @param {number|bigint|string} val - The signed integer to encode
 * @returns {string} Hex-encoded Clarity value
 */
function encodeInt(val) {
    let n = BigInt(val);
    const buf = new Uint8Array(17);
    buf[0] = CLARITY_TYPE_TAGS.INT;
    // Handle negative via two's complement
    if (n < 0n) {
        n = (1n << 128n) + n;
    }
    for (let i = 16; i >= 1; i--) {
        buf[i] = Number(n & 0xffn);
        n >>= 8n;
    }
    return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Encode a Clarity bool value to hex.
 * 
 * @param {boolean} val - The boolean to encode
 * @returns {string} Hex-encoded Clarity value ("03" for true, "04" for false)
 */
function encodeBool(val) {
    return val ? 
        CLARITY_TYPE_TAGS.BOOL_TRUE.toString(16).padStart(2, '0') : 
        CLARITY_TYPE_TAGS.BOOL_FALSE.toString(16).padStart(2, '0');
}

/**
 * Encode a Clarity standard principal to hex.
 * Format: 0x05 (type tag) + version byte + 20-byte hash160
 * 
 * @param {string} address - Stacks address (e.g., "SP2J6Z...")
 * @throws {Error} If the input is not a valid Stacks address format
 * @returns {string} Hex-encoded Clarity value
 */
function encodePrincipal(address) {
    if (typeof address !== 'string') throw new Error('encodePrincipal expects a string address');
    
    // Base58check decode
    const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let num = 0n;
    for (const char of address) {
        const idx = ALPHABET.indexOf(char);
        if (idx === -1) throw new Error(`Invalid base58 character: ${char}`);
        num = num * 58n + BigInt(idx);
    }
    
    // Convert to bytes (25 bytes: 1 version + 20 hash + 4 checksum)
    const rawBytes = [];
    while (num > 0n) {
        rawBytes.unshift(Number(num & 0xffn));
        num >>= 8n;
    }
    while (rawBytes.length < 25) rawBytes.unshift(0);
    
    const version = rawBytes[0];
    const hash160 = rawBytes.slice(1, 21);
    
    // Build Clarity principal: 0x05 + version + hash160
    const buf = new Uint8Array(22);
    buf[0] = CLARITY_TYPE_TAGS.PRINCIPAL_STANDARD;
    buf[1] = version;
    buf.set(hash160, 2);
    
    return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Encode a raw buffer to Clarity buffer hex.
 * Format: 0x02 (type tag) + 4-byte big-endian length + raw bytes
 * 
 * @param {Uint8Array|number[]} data - The buffer data
 * @returns {string} Hex-encoded Clarity value
 */
function encodeBuffer(data) {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    const len = bytes.length;
    const buf = new Uint8Array(5 + len);
    buf[0] = CLARITY_TYPE_TAGS.BUFFER;
    buf[1] = (len >> 24) & 0xff;
    buf[2] = (len >> 16) & 0xff;
    buf[3] = (len >> 8) & 0xff;
    buf[4] = len & 0xff;
    buf.set(bytes, 5);
    return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}

module.exports = {
    encodeStringAscii,
    encodeStringUtf8,
    encodeUint,
    encodeInt,
    encodeBool,
    encodePrincipal,
    encodeBuffer
};

