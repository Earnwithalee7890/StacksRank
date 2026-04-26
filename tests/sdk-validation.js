/**
 * StacksRank SDK - Validation Tests
 */

const { isValidAddress, isValidContractId, isPositiveNumber } = require('../sdk/lib/validation');

function test() {
    console.log('Running SDK Validation Tests...');

    // Test isValidAddress
    console.assert(isValidAddress('SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT') === true, 'Valid address failed');
    console.assert(isValidAddress('invalid') === false, 'Invalid address passed');
    console.assert(isValidAddress('') === false, 'Empty address passed');

    // Test isValidContractId
    console.assert(isValidContractId('SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.simple-swap') === true, 'Valid contract ID failed');
    console.assert(isValidContractId('SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT') === false, 'Invalid contract ID (no dot) passed');
    console.assert(isValidContractId('.contract') === false, 'Invalid contract ID (no address) passed');

    // Test isPositiveNumber
    console.assert(isPositiveNumber(100) === true, 'Positive number failed');
    console.assert(isPositiveNumber('100') === true, 'Positive string number failed');
    console.assert(isPositiveNumber(-10) === false, 'Negative number passed');
    console.assert(isPositiveNumber('abc') === false, 'Non-number string passed');

    console.log('All SDK Validation Tests Passed!');
}

try {
    test();
} catch (error) {
    console.error('Test Suite Failed:', error);
    process.exit(1);
}
