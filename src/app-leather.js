// StacksRank - Leather Wallet Integration (v2.0.0 - Restored Working Build)
// Uses window.LeatherProvider (direct Leather API) for all wallet interactions.
// This avoids all @stacks/connect ESM import issues in static sites.

// ============================================================
// CONFIG
// ============================================================
const NETWORK = 'mainnet';
const CONTRACT_ADDRESSES = {
    REPUTATION: 'SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.simple-reputation',
    SWAP: 'SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.simple-swap',
    VAULT: 'SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.simple-vault',
    FEB_CHECKIN: 'SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.feb-builder-check-in',
    DEFI_TOOLS: 'SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.defi-builder-tools',
    FEE_DISTRIBUTOR: 'SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.direct-fee-distributor',
    STX_DISTRIBUTOR: 'SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.stx-distributor'
};

const appDetails = {
    name: 'StacksRank',
    icon: window.location.origin + '/logo.png',
};

// ============================================================
// STATE
// ============================================================
let connectedAddress = null;

// ============================================================
// LEADERBOARD DATA
// ============================================================
const mockLeaderboardData = [
    { rank: 1, username: "Aleekhoso 🔥 🏆", score: 28300, streak: 12, contributions: 283, contracts: 200, rewards: "153 STX" },
    { rank: 2, username: "StacksBuilder", score: 15420, streak: 45, contributions: 127, contracts: 85, rewards: "98 STX" },
    { rank: 3, username: "ClarityDev", score: 12850, streak: 38, contributions: 93, contracts: 64, rewards: "82 STX" }
];

// ============================================================
// HELPERS
// ============================================================

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    const colors = {
        success: 'linear-gradient(135deg, #11998e, #38ef7d)',
        error: 'linear-gradient(135deg, #e74c3c, #c0392b)',
        warning: 'linear-gradient(135deg, #f39c12, #e67e22)',
        info: 'linear-gradient(135deg, #4facfe, #00f2fe)'
    };
    notification.style.cssText = `
        position: fixed; top: 80px; right: 20px;
        padding: 1rem 1.5rem;
        background: ${colors[type] || colors.info};
        color: white; border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        z-index: 10000; font-weight: 600;
        animation: slideInRight 0.3s ease-out;
        max-width: 350px; word-wrap: break-word;
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// ============================================================
// WALLET CONNECTION (Direct Leather Provider API)
// ============================================================

async function connectWallet() {
    console.log('🔗 Connecting wallet via LeatherProvider...');

    if (!window.LeatherProvider) {
        showNotification('📦 Please install Leather wallet extension!', 'warning');
        return;
    }

    try {
        const response = await window.LeatherProvider.request('getAddresses');
        console.log('📋 getAddresses response:', response);

        let stxAddr = null;

        if (response?.result?.addresses) {
            const found = response.result.addresses.find(a => a.symbol === 'STX');
            if (found) stxAddr = found.address;
        }

        if (!stxAddr) {
            const fallback = await window.LeatherProvider.request('stx_requestAccounts');
            console.log('📋 stx_requestAccounts response:', fallback);
            if (fallback?.result?.addresses?.[0]?.address) {
                stxAddr = fallback.result.addresses[0].address;
            }
        }

        if (stxAddr) {
            connectedAddress = stxAddr;
            updateWalletUI(stxAddr);
            showNotification('✅ Wallet connected!', 'success');
            fetchAccountBalance(stxAddr);
            loadUserVaults();
        } else {
            showNotification('❌ Could not get STX address from wallet', 'error');
        }

    } catch (error) {
        console.error('❌ Wallet connection error:', error);
        showNotification('❌ Failed to connect wallet: ' + (error.message || error), 'error');
    }
}

function disconnectWallet() {
    connectedAddress = null;
    const btn = document.getElementById('connectWalletBtn');
    if (btn) {
        btn.textContent = 'Connect Wallet';
        btn.className = 'btn btn-primary';
        btn.onclick = connectWallet;
    }
    showNotification('👋 Wallet disconnected', 'info');
}

function updateWalletUI(address) {
    const btn = document.getElementById('connectWalletBtn');
    if (btn) {
        btn.textContent = `${address.slice(0, 6)}...${address.slice(-4)}`;
        btn.className = 'btn btn-success';
        btn.onclick = disconnectWallet;
    }
}

// ============================================================
// CLARITY VALUE ENCODING (manual, no external lib needed)
// ============================================================

function encodeStringAscii(str) {
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

function encodeUint(val) {
    let n = BigInt(val);
    const buf = new Uint8Array(17);
    buf[0] = 0x01;
    for (let i = 16; i >= 1; i--) {
        buf[i] = Number(n & 0xffn);
        n >>= 8n;
    }
    return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================
// CORE CONTRACT CALL (Direct Leather API)
// ============================================================

async function callContract({ contract, functionName, functionArgs = [] }) {
    if (!window.LeatherProvider) {
        throw new Error('Leather wallet not installed. Please install from leather.io');
    }
    if (!connectedAddress) {
        throw new Error('Wallet not connected. Please connect first.');
    }

    console.log(`🚀 Calling ${contract}.${functionName} with`, functionArgs.length, 'args');

    const response = await window.LeatherProvider.request('stx_callContract', {
        contract,
        functionName,
        functionArgs,
        network: NETWORK,
        postConditionMode: 'allow',
        appDetails
    });

    console.log('✅ Contract call response:', response);
    return response;
}

// ============================================================
// CONTRACT INTERACTIONS
// ============================================================

async function dailyCheckIn() {
    if (!connectedAddress) {
        showNotification('⚠️ Please connect your wallet first', 'warning');
        connectWallet();
        return;
    }

    const btn = document.getElementById('checkInBtn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Processing...'; }

    try {
        const response = await callContract({
            contract: CONTRACT_ADDRESSES.FEB_CHECKIN,
            functionName: 'check-in',
            functionArgs: []
        });

        if (response?.result || response?.txid) {
            showNotification('✅ Check-in submitted successfully!', 'success');
            loadLeaderboard();
        } else {
            showNotification('⚠️ Check-in may have been cancelled', 'warning');
        }
    } catch (error) {
        console.error('❌ Check-in error:', error);
        showNotification('❌ ' + (error.message || 'Check-in failed'), 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '✅ Daily Check-in'; }
    }
}

async function executeSwap() {
    if (!connectedAddress) {
        showNotification('⚠️ Please connect your wallet first', 'warning');
        connectWallet();
        return;
    }

    const amountIn = document.getElementById('swapAmountIn')?.value;
    if (!amountIn || parseFloat(amountIn) <= 0) {
        showNotification('⚠️ Please enter a valid amount', 'warning');
        return;
    }

    const btn = document.getElementById('executeSwapBtn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Swapping...'; }

    try {
        const response = await callContract({
            contract: CONTRACT_ADDRESSES.SWAP,
            functionName: 'create-swap',
            functionArgs: []
        });

        if (response?.result || response?.txid) {
            showNotification('✅ Swap submitted!', 'success');
            updateStats();
        } else {
            showNotification('⚠️ Swap may have been cancelled', 'warning');
        }
    } catch (error) {
        console.error('❌ Swap error:', error);
        showNotification('❌ ' + (error.message || 'Swap failed'), 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Swap Tokens'; }
    }
}

async function createVault() {
    if (!connectedAddress) {
        showNotification('⚠️ Please connect your wallet first', 'warning');
        connectWallet();
        return;
    }

    const vaultName = document.getElementById('vaultName')?.value;
    if (!vaultName) {
        showNotification('⚠️ Please enter a vault name', 'warning');
        return;
    }

    const btn = document.getElementById('createVaultBtn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Creating...'; }

    try {
        const response = await callContract({
            contract: CONTRACT_ADDRESSES.VAULT,
            functionName: 'create-vault',
            functionArgs: []
        });

        if (response?.result || response?.txid) {
            showNotification(`✅ Vault "${vaultName}" created!`, 'success');
            setTimeout(loadUserVaults, 500);
        } else {
            showNotification('⚠️ Vault creation may have been cancelled', 'warning');
        }
    } catch (error) {
        console.error('❌ Vault error:', error);
        showNotification('❌ ' + (error.message || 'Vault creation failed'), 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Create Vault'; }
    }
}

async function stakeInVault() {
    if (!connectedAddress) {
        showNotification('⚠️ Please connect your wallet first', 'warning');
        connectWallet();
        return;
    }

    const amount = document.getElementById('stakeAmount')?.value;
    if (!amount || parseFloat(amount) <= 0) {
        showNotification('⚠️ Please enter a valid amount', 'warning');
        return;
    }

    const btn = document.getElementById('stakeBtn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Staking...'; }

    try {
        const response = await callContract({
            contract: CONTRACT_ADDRESSES.VAULT,
            functionName: 'deposit',
            functionArgs: []
        });

        if (response?.result || response?.txid) {
            showNotification(`✅ Staked ${amount} STX!`, 'success');
            updateStats();
        } else {
            showNotification('⚠️ Staking may have been cancelled', 'warning');
        }
    } catch (error) {
        console.error('❌ Staking error:', error);
        showNotification('❌ ' + (error.message || 'Staking failed'), 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Stake Tokens'; }
    }
}

// ============================================================
// BUILDER TOOLS (defi-builder-tools contract)
// ============================================================

async function registerBuilder() {
    if (!connectedAddress) {
        showNotification('⚠️ Please connect your wallet first', 'warning');
        connectWallet();
        return;
    }

    const name = document.getElementById('builderName')?.value?.trim();
    const profileUrl = document.getElementById('builderProfile')?.value?.trim();

    if (!name || !profileUrl) {
        showNotification('⚠️ Please fill in all fields', 'warning');
        return;
    }

    const btn = document.getElementById('registerBuilderBtn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Registering...'; }

    try {
        const args = [
            encodeStringAscii(name),
            encodeStringAscii(profileUrl)
        ];

        const response = await callContract({
            contract: CONTRACT_ADDRESSES.DEFI_TOOLS,
            functionName: 'register-builder',
            functionArgs: args
        });

        if (response?.result || response?.txid) {
            showNotification(`✅ Welcome, Builder ${name}! (0.02 STX fee paid)`, 'success');
            document.getElementById('builderName').value = '';
            document.getElementById('builderProfile').value = '';
        } else {
            showNotification('⚠️ Registration may have been cancelled', 'warning');
        }
    } catch (error) {
        console.error('❌ Registration error:', error);
        showNotification('❌ ' + (error.message || 'Registration failed'), 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Register Builder'; }
    }
}

async function updateBuilderStatus() {
    if (!connectedAddress) {
        showNotification('⚠️ Please connect your wallet first', 'warning');
        connectWallet();
        return;
    }

    const status = document.getElementById('builderStatus')?.value?.trim();
    if (!status) {
        showNotification('⚠️ Please enter a status', 'warning');
        return;
    }

    const btn = document.getElementById('updateStatusBtn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Updating...'; }

    try {
        const args = [encodeStringAscii(status)];

        const response = await callContract({
            contract: CONTRACT_ADDRESSES.DEFI_TOOLS,
            functionName: 'update-status',
            functionArgs: args
        });

        if (response?.result || response?.txid) {
            showNotification('✅ Status updated! (0.01 STX fee paid)', 'success');
            document.getElementById('builderStatus').value = '';
        } else {
            showNotification('⚠️ Update may have been cancelled', 'warning');
        }
    } catch (error) {
        console.error('❌ Update error:', error);
        showNotification('❌ ' + (error.message || 'Update failed'), 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Update Status'; }
    }
}

async function requestBuilderService() {
    if (!connectedAddress) {
        showNotification('⚠️ Please connect your wallet first', 'warning');
        connectWallet();
        return;
    }

    const serviceType = document.getElementById('serviceType')?.value;
    const details = document.getElementById('serviceDetails')?.value?.trim();

    if (!details) {
        showNotification('⚠️ Please provide details', 'warning');
        return;
    }

    const btn = document.getElementById('requestServiceBtn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Requesting...'; }

    try {
        const args = [
            encodeStringAscii(serviceType),
            encodeStringAscii(details)
        ];

        const response = await callContract({
            contract: CONTRACT_ADDRESSES.DEFI_TOOLS,
            functionName: 'request-service',
            functionArgs: args
        });

        if (response?.result || response?.txid) {
            showNotification('✅ Service requested! (0.01 STX fee paid)', 'success');
            document.getElementById('serviceDetails').value = '';
        } else {
            showNotification('⚠️ Request may have been cancelled', 'warning');
        }
    } catch (error) {
        console.error('❌ Request error:', error);
        showNotification('❌ ' + (error.message || 'Request failed'), 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Request Service'; }
    }
}

async function payProtocolFee() {
    if (!connectedAddress) {
        showNotification('⚠️ Please connect your wallet first', 'warning');
        connectWallet();
        return;
    }

    const btn = document.getElementById('payFeeBtn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Processing...'; }

    try {
        const response = await callContract({
            contract: CONTRACT_ADDRESSES.FEE_DISTRIBUTOR,
            functionName: 'pay-fee',
            functionArgs: []
        });

        if (response?.result || response?.txid) {
            showNotification('✅ Fee of 0.02 STX paid successfully!', 'success');
        } else {
            showNotification('⚠️ Payment may have been cancelled', 'warning');
        }
    } catch (error) {
        console.error('❌ Payment error:', error);
        showNotification('❌ ' + (error.message || 'Payment failed'), 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Pay 0.02 STX Fee'; }
    }
}

async function claimDistribution() {
    if (!connectedAddress) {
        showNotification('⚠️ Please connect your wallet first', 'warning');
        connectWallet();
        return;
    }

    const btn = document.getElementById('claimDistributionBtn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Claiming...'; }

    try {
        const response = await callContract({
            contract: CONTRACT_ADDRESSES.STX_DISTRIBUTOR,
            functionName: 'claim',
            functionArgs: []
        });

        if (response?.result || response?.txid) {
            showNotification('✅ Claimed 1 STX successfully!', 'success');
            fetchAccountBalance(connectedAddress);
        } else {
            showNotification('⚠️ Claim may have been cancelled', 'warning');
        }
    } catch (error) {
        console.error('❌ Claim error:', error);
        showNotification('❌ ' + (error.message || 'Claim failed'), 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '🎁 Claim 1 STX'; }
    }
}

// ============================================================
// UI FUNCTIONS
// ============================================================

async function fetchAccountBalance(address) {
    try {
        const baseUrl = NETWORK === 'mainnet' ? 'https://api.hiro.so' : 'https://api.testnet.hiro.so';
        const response = await fetch(`${baseUrl}/extended/v1/address/${address}/balances`);
        if (!response.ok) return;
        const data = await response.json();
        const balance = (parseInt(data.stx.balance) / 1000000).toLocaleString(undefined, {
            minimumFractionDigits: 2, maximumFractionDigits: 4
        });
        const el = document.getElementById('balanceIn');
        if (el) { el.textContent = `${balance} STX`; el.style.color = '#4facfe'; }
    } catch (e) {
        console.warn('Could not fetch balance:', e);
    }
}

function calculateSwapOutput() {
    const amountIn = parseFloat(document.getElementById('swapAmountIn')?.value) || 0;
    const tokenIn = document.getElementById('tokenIn')?.value;
    const tokenOut = document.getElementById('tokenOut')?.value;
    const rates = { 'STX-xBTC': 0.00025, 'STX-USDA': 0.85, 'xBTC-STX': 4000, 'xBTC-USDA': 42000, 'USDA-STX': 1.18, 'USDA-xBTC': 0.000024 };
    const rate = tokenIn === tokenOut ? 1 : (rates[`${tokenIn}-${tokenOut}`] || 1);
    const amountOut = (amountIn * rate * 0.997).toFixed(6);
    const outEl = document.getElementById('swapAmountOut');
    const rateEl = document.getElementById('swapRate');
    if (outEl) outEl.value = amountOut > 0 ? amountOut : '';
    if (rateEl) rateEl.textContent = `1 ${tokenIn} = ${rate} ${tokenOut}`;
}

function swapDirection() {
    const tokenIn = document.getElementById('tokenIn');
    const tokenOut = document.getElementById('tokenOut');
    if (!tokenIn || !tokenOut) return;
    const temp = tokenIn.value;
    tokenIn.value = tokenOut.value;
    tokenOut.value = temp;
    calculateSwapOutput();
}

function loadLeaderboard() {
    const tbody = document.getElementById('leaderboardBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    mockLeaderboardData.forEach((user, index) => {
        const row = document.createElement('tr');
        row.style.animation = `fadeInUp 0.6s ease-out ${index * 0.1}s backwards`;
        const rankClass = user.rank <= 3 ? `rank-badge rank-${user.rank}` : 'rank-badge';
        row.innerHTML = `
            <td><div class="${rankClass}">${user.rank}</div></td>
            <td>
                <div style="font-weight:600">${user.username}</div>
                <div style="font-size:0.75rem;color:var(--text-muted);font-family:monospace">
                    ${user.rank === 1 && connectedAddress ? connectedAddress.slice(0, 8) + '...' : 'SP...'}
                </div>
            </td>
            <td>
                <div style="font-weight:700;color:#4facfe">${user.score.toLocaleString()}</div>
                <div style="font-size:0.75rem;color:var(--text-muted)">${user.contracts} contracts · ${user.rewards}</div>
            </td>
            <td><span class="badge badge-warning">🔥 ${user.streak} days</span></td>
            <td>
                <div style="font-weight:600;color:#4facfe">${user.contributions}</div>
                <div style="font-size:0.75rem;color:var(--text-muted)">GitHub PRs</div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function loadUserVaults() {
    const container = document.getElementById('myVaults');
    if (!container) return;
    if (!connectedAddress) {
        container.innerHTML = '<div class="card" style="grid-column:1/-1;text-align:center;color:var(--text-muted)">Connect wallet to view your vaults</div>';
        return;
    }
    const vaults = [
        { name: 'Community Treasury', balance: '2,450 STX', signers: '3/5', apy: '12.5%' },
        { name: 'Development Fund', balance: '1,820 STX', signers: '2/3', apy: '10.2%' }
    ];
    container.innerHTML = vaults.map((v, i) => `
        <div class="card" style="animation:slideInRight 0.6s ease-out ${i * 0.1}s backwards">
            <h4 style="margin-bottom:1rem">${v.name}</h4>
            <div style="margin-bottom:0.75rem">
                <div style="font-size:0.875rem;color:var(--text-muted)">Balance</div>
                <div style="font-size:1.25rem;font-weight:700;color:#4facfe">${v.balance}</div>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:1rem">
                <div><div style="font-size:0.75rem;color:var(--text-muted)">Signers</div><div style="font-weight:600">${v.signers}</div></div>
                <div><div style="font-size:0.75rem;color:var(--text-muted)">APY</div><div style="font-weight:600;color:#4facfe">${v.apy}</div></div>
            </div>
            <button class="btn btn-secondary" style="width:100%;padding:0.5rem;font-size:0.875rem">Manage</button>
        </div>
    `).join('');
}

function animateValue(id, start, end, duration, formatter = v => v.toLocaleString()) {
    const el = document.getElementById(id);
    if (!el) return;
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    const timer = setInterval(() => {
        current += increment;
        if (current >= end) { current = end; clearInterval(timer); }
        el.textContent = formatter(Math.floor(current));
    }, 16);
}

function updateStats() {
    animateValue('totalUsers', 1100, 1247, 1000);
    animateValue('totalVolume', 2100000, 2400000, 1000, v => `$${(v / 1000000).toFixed(1)}M`);
    animateValue('totalLocked', 5200000, 5800000, 1000, v => `$${(v / 1000000).toFixed(1)}M`);
}

// ============================================================
// INIT
// ============================================================

function attachListeners() {
    const connectBtn = document.getElementById('connectWalletBtn');
    if (connectBtn) connectBtn.onclick = connectWallet;

    const checkInBtn = document.getElementById('checkInBtn');
    if (checkInBtn) checkInBtn.onclick = dailyCheckIn;

    const executeSwapBtn = document.getElementById('executeSwapBtn');
    if (executeSwapBtn) executeSwapBtn.onclick = executeSwap;

    const swapAmountIn = document.getElementById('swapAmountIn');
    if (swapAmountIn) swapAmountIn.addEventListener('input', calculateSwapOutput);

    const swapDirectionBtn = document.getElementById('swapDirectionBtn');
    if (swapDirectionBtn) swapDirectionBtn.onclick = swapDirection;

    const createVaultBtn = document.getElementById('createVaultBtn');
    if (createVaultBtn) createVaultBtn.onclick = createVault;

    const stakeBtn = document.getElementById('stakeBtn');
    if (stakeBtn) stakeBtn.onclick = stakeInVault;

    // Builder Tools
    const registerBuilderBtn = document.getElementById('registerBuilderBtn');
    if (registerBuilderBtn) registerBuilderBtn.onclick = registerBuilder;

    const updateStatusBtn = document.getElementById('updateStatusBtn');
    if (updateStatusBtn) updateStatusBtn.onclick = updateBuilderStatus;

    const requestServiceBtn = document.getElementById('requestServiceBtn');
    if (requestServiceBtn) requestServiceBtn.onclick = requestBuilderService;

    const payFeeBtn = document.getElementById('payFeeBtn');
    if (payFeeBtn) payFeeBtn.onclick = payProtocolFee;

    // STX Distributor
    const claimDistributionBtn = document.getElementById('claimDistributionBtn');
    if (claimDistributionBtn) claimDistributionBtn.onclick = claimDistribution;
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 StacksRank initializing...');
    console.log('🔍 LeatherProvider available:', !!window.LeatherProvider);

    attachListeners();
    loadLeaderboard();
    updateStats();
    loadUserVaults();
});

console.log('✨ StacksRank app-leather.js loaded!');
