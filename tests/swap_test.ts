import { describe, it, expect, beforeEach } from 'vitest';
import { deployContract, callReadOnly, broadcastTransaction } from './utils';
import { txSender } from './utils';

let contractAddress: string;

describe('STX Swap Contract', () => {
  beforeEach(async () => {
    // Deploy fresh contract before each test
    contractAddress = await deployContract('stx-swap.clar');
  });

  it('should initialize swap counter and total volume', async () => {
    const stats = await callReadOnly(contractAddress, 'get-stats', {});
    expect(stats.totalSwaps).toBe(0);
    expect(stats.totalVolume).toBe(0);
    expect(stats.feePercentage).toBe(30); // 0.3%
  });

  it('should calculate fee correctly', async () => {
    const fee1 = await callReadOnly(contractAddress, 'calculate-fee', { amount: 1000 });
    expect(fee1).toBe(3); // 0.3% of 1000

    const fee2 = await callReadOnly(contractAddress, 'calculate-fee', { amount: 5000 });
    expect(fee2).toBe(15); // 0.3% of 5000
  });

  it('should create a swap correctly', async () => {
    const swapId = await broadcastTransaction(
      contractAddress,
      'create-swap',
      { counterparty: txSender.user1, amount: 2000, duration: 10 },
      txSender.owner
    );

    const swap = await callReadOnly(contractAddress, 'get-swap', { swapId });
    const expectedFee = Math.floor((2000 * 30) / 10000);
    expect(swap.initiator).toBe(txSender.owner);
    expect(swap.counterparty).toBe(txSender.user1);
    expect(swap.amount).toBe(2000);
    expect(swap.fee).toBe(expectedFee);
    expect(swap.completed).toBe(false);
    expect(swap.cancelled).toBe(false);
  });

  it('should allow counterparty to accept a swap and update total-volume', async () => {
    const swapId = await broadcastTransaction(
      contractAddress,
      'create-swap',
      { counterparty: txSender.user1, amount: 1500, duration: 10 },
      txSender.owner
    );

    await broadcastTransaction(contractAddress, 'accept-swap', { swapId }, txSender.user1);

    const swap = await callReadOnly(contractAddress, 'get-swap', { swapId });
    expect(swap.completed).toBe(true);

    const stats = await callReadOnly(contractAddress, 'get-stats', {});
    expect(stats.totalVolume).toBe(1500);
  });

  it('should allow initiator to cancel a swap before it is accepted', async () => {
    const swapId = await broadcastTransaction(
      contractAddress,
      'create-swap',
      { counterparty: txSender.user1, amount: 1200, duration: 10 },
      txSender.owner
    );

    await broadcastTransaction(contractAddress, 'cancel-swap', { swapId }, txSender.owner);

    const swap = await callReadOnly(contractAddress, 'get-swap', { swapId });
    expect(swap.cancelled).toBe(true);
    expect(swap.completed).toBe(false);
  });

  it('should fail to accept expired swap', async () => {
    const swapId = await broadcastTransaction(
      contractAddress,
      'create-swap',
      { counterparty: txSender.user1, amount: 500, duration: 0 },
      txSender.owner
    );

    let error = null;
    try {
      await broadcastTransaction(contractAddress, 'accept-swap', { swapId }, txSender.user1);
    } catch (err) {
      error = err;
    }
    expect(error).not.toBeNull();
  });
});/ Mock test for swap contract
