/**
 * StacksRank SDK - Clarity Value Encoding (ESM)
 */

export function encodeStringAscii(str) {
    if (typeof str !== 'string') throw new Error('encodeStringAscii expects a string');
    const bytes = new TextEncoder().encode(str);
    const len = bytes.length;
    const buf = new Uint8Array(5 + len);
    buf[0] = 0x0d; 
    buf[1] = (len >> 24) & 0xff;
    buf[2] = (len >> 16) & 0xff;
    buf[3] = (len >> 8) & 0xff;
    buf[4] = len & 0xff;
    buf.set(bytes, 5);
    return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function encodeStringUtf8(str) {
    if (typeof str !== 'string') throw new Error('encodeStringUtf8 expects a string');
    const bytes = new TextEncoder().encode(str);
    const len = bytes.length;
    const buf = new Uint8Array(5 + len);
    buf[0] = 0x0e; 
    buf[1] = (len >> 24) & 0xff;
    buf[2] = (len >> 16) & 0xff;
    buf[3] = (len >> 8) & 0xff;
    buf[4] = len & 0xff;
    buf.set(bytes, 5);
    return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function encodeUint(val) {
    let n = BigInt(val);
    if (n < 0n) throw new Error('encodeUint expects a non-negative value');
    const buf = new Uint8Array(17);
    buf[0] = 0x01; 
    for (let i = 16; i >= 1; i--) {
        buf[i] = Number(n & 0xffn);
        n >>= 8n;
    }
    return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function encodeInt(val) {
    let n = BigInt(val);
    const buf = new Uint8Array(17);
    buf[0] = 0x00; 
    if (n < 0n) {
        n = (1n << 128n) + n;
    }
    for (let i = 16; i >= 1; i--) {
        buf[i] = Number(n & 0xffn);
        n >>= 8n;
    }
    return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function encodeBool(val) {
    return val ? '03' : '04'; 
}

export function encodePrincipal(address) {
    if (typeof address !== 'string') throw new Error('encodePrincipal expects a string address');
    const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let num = 0n;
    for (const char of address) {
        const idx = ALPHABET.indexOf(char);
        if (idx === -1) throw new Error(`Invalid base58 character: ${char}`);
        num = num * 58n + BigInt(idx);
    }
    const rawBytes = [];
    while (num > 0n) {
        rawBytes.unshift(Number(num & 0xffn));
        num >>= 8n;
    }
    while (rawBytes.length < 25) rawBytes.unshift(0);
    const version = rawBytes[0];
    const hash160 = rawBytes.slice(1, 21);
    const buf = new Uint8Array(22);
    buf[0] = 0x05; 
    buf[1] = version;
    buf.set(hash160, 2);
    return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function encodeBuffer(data) {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    const len = bytes.length;
    const buf = new Uint8Array(5 + len);
    buf[0] = 0x02; 
    buf[1] = (len >> 24) & 0xff;
    buf[2] = (len >> 16) & 0xff;
    buf[3] = (len >> 8) & 0xff;
    buf[4] = len & 0xff;
    buf.set(bytes, 5);
    return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}
