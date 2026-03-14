/**
 * StacksRank SDK - Tests
 */

const sdk = require('./index');

let passed = 0;
let failed = 0;

function assert(condition, name) {
    if (condition) {
        console.log(`  ✅ ${name}`);
        passed++;
    } else {
        console.error(`  ❌ ${name}`);
        failed++;
    }
}

console.log('\n🧪 StacksRank SDK Tests\n');

// Encoding tests
console.log('📦 Encoding:');
assert(typeof sdk.encodeStringAscii('hello') === 'string', 'encodeStringAscii returns string');
assert(sdk.encodeStringAscii('hello').startsWith('0d'), 'encodeStringAscii starts with 0d tag');
assert(sdk.encodeStringAscii('').startsWith('0d00000000'), 'encodeStringAscii empty string');

assert(typeof sdk.encodeUint(100) === 'string', 'encodeUint returns string');
assert(sdk.encodeUint(0).startsWith('01'), 'encodeUint starts with 01 tag');
assert(sdk.encodeUint(1).endsWith('01'), 'encodeUint(1) ends with 01');

assert(sdk.encodeInt(0).startsWith('00'), 'encodeInt starts with 00 tag');
assert(sdk.encodeInt(-1).startsWith('00'), 'encodeInt negative starts with 00 tag');

assert(sdk.encodeBool(true) === '03', 'encodeBool true = 03');
assert(sdk.encodeBool(false) === '04', 'encodeBool false = 04');

assert(sdk.encodeStringUtf8('test').startsWith('0e'), 'encodeStringUtf8 starts with 0e tag');

assert(sdk.encodeBuffer(new Uint8Array([1, 2, 3])).startsWith('02'), 'encodeBuffer starts with 02 tag');

// Contract tests
console.log('\n📋 Contracts:');
assert(sdk.DEPLOYER === 'SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT', 'DEPLOYER address correct');
assert(sdk.CONTRACTS.FEB_CHECKIN.address.includes('feb-builder-check-in'), 'FEB_CHECKIN address correct');
assert(sdk.CONTRACTS.STX_DISTRIBUTOR.functions.claim === 'claim', 'STX_DISTRIBUTOR claim function');

const addresses = sdk.getContractAddresses();
assert(Object.keys(addresses).length >= 7, 'getContractAddresses returns all contracts');

// Wallet tests (browser-only, just check exports exist)
console.log('\n🔗 Wallet:');
assert(typeof sdk.detectWallet === 'function', 'detectWallet exported');
assert(typeof sdk.connectWallet === 'function', 'connectWallet exported');
assert(typeof sdk.callContract === 'function', 'callContract exported');
assert(typeof sdk.formatAddress === 'function', 'formatAddress exported');
assert(sdk.formatAddress('SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7') === 'SP2J6Z...9EJ7', 'formatAddress truncates correctly');

// API tests (just check exports)
console.log('\n🌐 API:');
assert(typeof sdk.getBalance === 'function', 'getBalance exported');
assert(typeof sdk.getTransactions === 'function', 'getTransactions exported');
assert(typeof sdk.getBlockHeight === 'function', 'getBlockHeight exported');
assert(typeof sdk.readContract === 'function', 'readContract exported');
assert(sdk.microToStx(1000000) === 1, 'microToStx(1000000) = 1');
assert(sdk.stxToMicro(1) === 1000000, 'stxToMicro(1) = 1000000');
assert(sdk.microToStx(500000) === 0.5, 'microToStx(500000) = 0.5');

// Summary
console.log(`\n${'='.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${'='.repeat(40)}\n`);

process.exit(failed > 0 ? 1 : 0);
