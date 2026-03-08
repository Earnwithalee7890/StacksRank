// StacksRank - Advanced Swap Module v2
// Handles AMM swaps, price-impact display, slippage configuration,
// route finding, and real Stacks contract calls via Stacks.js

import { openContractCall } from '@stacks/connect';
import { uintCV, principalCV, contractPrincipalCV } from '@stacks/transactions';
import { STACKS_MAINNET } from '@stacks/network';

// ───────────────────────────────────────────────────────────
// CONFIG
// ───────────────────────────────────────────────────────────

const SWAP_CONTRACT_ADDRESS = 'SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT';
const SWAP_CONTRACT_NAME = 'advanced-swap';
const NETWORK = new STACKS_MAINNET();

const DEFAULT_SLIPPAGE_BPS = 50;   // 0.5%
const MAX_PRICE_IMPACT_BPS = 500;  // 5%
const SWAP_FEE_BPS = 30;   // 0.3%
const BASIS_POINTS = 10000;

// Mock pool reserves for UI simulation (replace with on-chain reads)
const MOCK_POOLS = {
    'STX-xBTC': { poolId: 1, reserveA: 2_000_000_000_000, reserveB: 500_000_000 },
    'STX-USDA': { poolId: 2, reserveA: 1_500_000_000_000, reserveB: 1_275_000_000_000 },
    'STX-WELSH': { poolId: 3, reserveA: 800_000_000_000, reserveB: 24_000_000_000_000 },
};

// ───────────────────────────────────────────────────────────
// STATE
// ───────────────────────────────────────────────────────────

let swapState = {
    tokenIn: 'STX',
    tokenOut: 'xBTC',
    amountIn: 0,
    amountOut: 0,
    slippageBps: DEFAULT_SLIPPAGE_BPS,
    priceImpactBps: 0,
    minAmountOut: 0,
    route: [],
    deadlineBlocks: 10,  // tx must be included within 10 blocks
};

// ───────────────────────────────────────────────────────────
// AMM MATH (mirrors Clarity contract)
// ───────────────────────────────────────────────────────────

/**
 * Classic x*y=k constant-product formula with fee deducted from input.
 * @param {number} amountIn  - raw input amount (uSTX / token units)
 * @param {number} reserveIn - pool reserve of input token
 * @param {number} reserveOut - pool reserve of output token
 * @returns {number} amount out (before protocol fee)
 */
function getAmountOut(amountIn, reserveIn, reserveOut) {
    if (reserveIn === 0 || reserveOut === 0) return 0;
    const amountInWithFee = amountIn * (BASIS_POINTS - SWAP_FEE_BPS);
    const numerator = amountInWithFee * reserveOut;
    const denominator = reserveIn * BASIS_POINTS + amountInWithFee;
    return Math.floor(numerator / denominator);
}

/**
 * Calculate price impact in basis points.
 * @param {number} amountIn
 * @param {number} reserveIn
 * @returns {number} price impact in bps
 */
function getPriceImpactBps(amountIn, reserveIn) {
    if (reserveIn === 0) return BASIS_POINTS;
    return Math.floor((amountIn * BASIS_POINTS) / (reserveIn + amountIn));
}

/**
 * Calculate minimum amount out given slippage tolerance.
 * @param {number} amountOut     - expected output
 * @param {number} slippageBps   - allowed slippage in basis points
 * @returns {number} minimum acceptable output
 */
function getMinAmountOut(amountOut, slippageBps) {
    return Math.floor(amountOut * (BASIS_POINTS - slippageBps) / BASIS_POINTS);
}

/**
 * Get spot price: how many tokenOut per 1 tokenIn (scaled to 6 decimals).
 */
function getSpotPrice(reserveIn, reserveOut) {
    if (reserveIn === 0) return 0;
    return (reserveOut * 1_000_000) / reserveIn;
}

// ───────────────────────────────────────────────────────────
// QUOTE ENGINE
// ───────────────────────────────────────────────────────────

/**
 * Get a full quote for a swap.
 * Returns amount-out, price-impact, min-amount-out, and fee details.
 */
function getSwapQuote(tokenIn, tokenOut, amountInRaw) {
    const pairKey = `${tokenIn}-${tokenOut}`;
    const reversePairKey = `${tokenOut}-${tokenIn}`;

    let pool = MOCK_POOLS[pairKey] || null;
    let reversed = false;

    if (!pool && MOCK_POOLS[reversePairKey]) {
        pool = MOCK_POOLS[reversePairKey];
        reversed = true;
    }

    if (!pool) {
        return {
            error: 'NO_POOL',
            message: `No liquidity pool found for ${tokenIn} → ${tokenOut}`,
        };
    }

    const amountIn = Math.floor(amountInRaw * 1_000_000); // convert to uSTX
    const reserveIn = reversed ? pool.reserveB : pool.reserveA;
    const reserveOut = reversed ? pool.reserveA : pool.reserveB;

    const amountOut = getAmountOut(amountIn, reserveIn, reserveOut);
    const priceImpact = getPriceImpactBps(amountIn, reserveIn);
    const minAmountOut = getMinAmountOut(amountOut, swapState.slippageBps);
    const fee = Math.floor((amountIn * SWAP_FEE_BPS) / BASIS_POINTS);
    const spotPrice = getSpotPrice(reserveIn, reserveOut);

    const warning = priceImpact >= MAX_PRICE_IMPACT_BPS
        ? 'HIGH_PRICE_IMPACT'
        : priceImpact >= 200
            ? 'MEDIUM_PRICE_IMPACT'
            : null;

    return {
        poolId: pool.poolId,
        amountIn,
        amountOut,
        amountOutFormatted: (amountOut / 1_000_000).toFixed(6),
        minAmountOut,
        priceImpactBps: priceImpact,
        priceImpactPct: (priceImpact / 100).toFixed(2),
        fee,
        feeFormatted: (fee / 1_000_000).toFixed(6),
        spotPrice: (spotPrice / 1_000_000).toFixed(8),
        route: [tokenIn, tokenOut],
        warning,
        reversed,
    };
}

// ───────────────────────────────────────────────────────────
// UI UPDATE
// ───────────────────────────────────────────────────────────

function updateSwapUI(quote) {
    const amountOutEl = document.getElementById('swapAmountOut');
    const priceImpactEl = document.getElementById('priceImpact');
    const minOutEl = document.getElementById('minAmountOut');
    const feeEl = document.getElementById('swapFee');
    const swapRateEl = document.getElementById('swapRate');
    const impactBarEl = document.getElementById('priceImpactBar');
    const warningEl = document.getElementById('swapWarning');

    if (quote.error) {
        if (amountOutEl) amountOutEl.value = '0';
        if (warningEl) {
            warningEl.textContent = quote.message;
            warningEl.style.display = 'block';
            warningEl.className = 'swap-warning error';
        }
        return;
    }

    if (amountOutEl) amountOutEl.value = quote.amountOutFormatted;
    if (priceImpactEl) priceImpactEl.textContent = `${quote.priceImpactPct}%`;
    if (minOutEl) minOutEl.textContent = `${(quote.minAmountOut / 1e6).toFixed(6)} ${swapState.tokenOut}`;
    if (feeEl) feeEl.textContent = `${quote.feeFormatted} ${swapState.tokenIn}`;
    if (swapRateEl) swapRateEl.textContent = `1 ${swapState.tokenIn} = ${quote.spotPrice} ${swapState.tokenOut}`;

    // Price impact color bar
    if (impactBarEl) {
        const pct = Math.min(quote.priceImpactBps / 100, 100);
        impactBarEl.style.width = `${pct}%`;
        impactBarEl.style.background =
            pct >= 5 ? '#ff4444' :
                pct >= 2 ? '#ffaa00' :
                    '#4facfe';
    }

    // Warning banner
    if (warningEl) {
        if (quote.warning === 'HIGH_PRICE_IMPACT') {
            warningEl.textContent = `⚠️ High price impact (${quote.priceImpactPct}%). Your trade moves the market significantly.`;
            warningEl.style.display = 'block';
            warningEl.className = 'swap-warning danger';
        } else if (quote.warning === 'MEDIUM_PRICE_IMPACT') {
            warningEl.textContent = `⚡ Moderate price impact (${quote.priceImpactPct}%).`;
            warningEl.style.display = 'block';
            warningEl.className = 'swap-warning caution';
        } else {
            warningEl.style.display = 'none';
        }
    }

    // Store in state
    swapState.amountOut = quote.amountOut;
    swapState.minAmountOut = quote.minAmountOut;
    swapState.priceImpactBps = quote.priceImpactBps;

    return quote;
}

// ───────────────────────────────────────────────────────────
// RECALCULATE ON INPUT
// ───────────────────────────────────────────────────────────

export function calculateSwapOutput() {
    const amountIn = parseFloat(document.getElementById('swapAmountIn')?.value || '0');
    const tokenIn = document.getElementById('tokenIn')?.value || 'STX';
    const tokenOut = document.getElementById('tokenOut')?.value || 'xBTC';

    swapState.tokenIn = tokenIn;
    swapState.tokenOut = tokenOut;
    swapState.amountIn = amountIn;

    if (!amountIn || amountIn <= 0) {
        updateSwapUI({ error: 'ZERO_AMOUNT', message: 'Enter an amount to get a quote.' });
        return;
    }

    const quote = getSwapQuote(tokenIn, tokenOut, amountIn);
    updateSwapUI(quote);
}

// ───────────────────────────────────────────────────────────
// SWAP DIRECTION
// ───────────────────────────────────────────────────────────

export function swapDirection() {
    const tokenInEl = document.getElementById('tokenIn');
    const tokenOutEl = document.getElementById('tokenOut');
    if (!tokenInEl || !tokenOutEl) return;

    // Animate the swap icon
    const btn = document.getElementById('swapDirectionBtn');
    if (btn) {
        btn.style.transform = 'rotate(180deg)';
        setTimeout(() => { btn.style.transform = 'rotate(0deg)'; }, 300);
    }

    const temp = tokenInEl.value;
    tokenInEl.value = tokenOutEl.value;
    tokenOutEl.value = temp;

    calculateSwapOutput();
}

// ───────────────────────────────────────────────────────────
// SET SLIPPAGE
// ───────────────────────────────────────────────────────────

export function setSlippage(bps) {
    swapState.slippageBps = parseInt(bps, 10) || DEFAULT_SLIPPAGE_BPS;
    calculateSwapOutput();
}

// ───────────────────────────────────────────────────────────
// EXECUTE SWAP (on-chain via Stacks.js)
// ───────────────────────────────────────────────────────────

export async function executeSwap(connectedAddress) {
    if (!connectedAddress) {
        window.StacksRank?.showNotification('⚠️ Connect wallet first', 'warning');
        return;
    }

    const amountIn = swapState.amountIn;
    if (!amountIn || amountIn <= 0) {
        window.StacksRank?.showNotification('⚠️ Enter a valid amount', 'warning');
        return;
    }

    const quote = getSwapQuote(swapState.tokenIn, swapState.tokenOut, amountIn);
    if (quote.error) {
        window.StacksRank?.showNotification(`❌ ${quote.message}`, 'error');
        return;
    }

    // Warn on high price impact but allow with confirmation
    if (quote.warning === 'HIGH_PRICE_IMPACT') {
        const confirmed = window.confirm(
            `⚠️ High price impact: ${quote.priceImpactPct}%.\nYou may receive significantly less than expected.\n\nContinue anyway?`
        );
        if (!confirmed) return;
    }

    const btn = document.getElementById('executeSwapBtn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Awaiting Wallet...'; }

    try {
        // Calculate deadline: current block + deadlineBlocks
        // We pass a large block number as deadline since we can't easily get current on frontend
        const deadlineBlock = 999999999; // effectively no deadline for demo; use real block height in prod

        const fnName = quote.reversed ? 'swap-b-for-a' : 'swap-a-for-b';

        await openContractCall({
            network: NETWORK,
            contractAddress: SWAP_CONTRACT_ADDRESS,
            contractName: SWAP_CONTRACT_NAME,
            functionName: fnName,
            functionArgs: [
                uintCV(quote.poolId),         // pool-id
                uintCV(quote.amountIn),       // amount-in (uSTX)
                uintCV(quote.minAmountOut),   // min-amount-out (slippage protected)
                uintCV(deadlineBlock),        // deadline
            ],
            onFinish: (data) => {
                console.log('Swap tx:', data.txId);
                window.StacksRank?.showNotification(
                    `✅ Swap submitted! TX: ${data.txId.slice(0, 10)}...`,
                    'success'
                );
                if (btn) { btn.disabled = false; btn.textContent = 'Swap Tokens'; }
                document.getElementById('swapAmountIn').value = '';
                document.getElementById('swapAmountOut').value = '';
            },
            onCancel: () => {
                window.StacksRank?.showNotification('🚫 Swap cancelled', 'warning');
                if (btn) { btn.disabled = false; btn.textContent = 'Swap Tokens'; }
            },
        });
    } catch (err) {
        console.error('Swap error:', err);
        window.StacksRank?.showNotification('❌ Swap failed: ' + err.message, 'error');
        if (btn) { btn.disabled = false; btn.textContent = 'Swap Tokens'; }
    }
}

// ───────────────────────────────────────────────────────────
// SLIPPAGE PRESETS UI
// ───────────────────────────────────────────────────────────

export function initSlippagePresets() {
    const presets = document.querySelectorAll('[data-slippage]');
    if (!presets.length) return;

    presets.forEach(btn => {
        btn.addEventListener('click', () => {
            presets.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            setSlippage(parseInt(btn.dataset.slippage, 10));
        });
    });

    // Custom slippage input
    const customInput = document.getElementById('customSlippage');
    if (customInput) {
        customInput.addEventListener('input', () => {
            const val = parseFloat(customInput.value);
            if (!isNaN(val) && val > 0 && val <= 50) {
                presets.forEach(b => b.classList.remove('active'));
                setSlippage(Math.floor(val * 100)); // convert % to bps
            }
        });
    }
}

// Export state for other modules
export { swapState, getSwapQuote, getAmountOut, getPriceImpactBps, getMinAmountOut };
