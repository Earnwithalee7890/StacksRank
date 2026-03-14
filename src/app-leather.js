// StacksRank - Leather Wallet Integration (v1.2.3 - "Secret Sauce" Build)
import { Buffer } from 'https://esm.sh/buffer@6.0.3';

// CRITICAL: Stacks.js requires Buffer to be available globally in the browser
if (typeof window !== 'undefined') {
    window.Buffer = Buffer;
    window.global = window;
}

import { openContractCall, showConnect, AppConfig, UserSession } from 'https://esm.sh/@stacks/connect@8.2.2';
import { StacksMainnet } from 'https://esm.sh/@stacks/network@7.2.0';
import { AnchorMode, PostConditionMode, stringAsciiCV } from 'https://esm.sh/@stacks/transactions@7.3.0';

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

// State
const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });
let connectedAddress = null;
let stacksNetwork = new StacksMainnet();

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
// WALLET CONNECTION
// ============================================================

async function connectWallet() {
    console.log('🔗 Attempting to connect wallet...');
    
    // Check if Leather/Hiro is available directly to avoid auto-opening links
    const isExtensionAvailable = !!(window.StacksProvider || window.LeatherProvider);
    
    if (!isExtensionAvailable) {
        showNotification('📦 Leather wallet not detected. Please install it to continue.', 'warning');
        console.warn('Wallet extension not found. Avoiding auto-open as per user preference.');
        return;
    }
    
    showConnect({
        appDetails,
        userSession,
        onFinish: () => {
             const userData = userSession.loadUserData();
             connectedAddress = userData.profile.stxAddress.mainnet || userData.profile.stxAddress.testnet || userData.profile.stxAddress;
             if (typeof connectedAddress === 'object') connectedAddress = connectedAddress.address || Object.values(connectedAddress)[0];
             
             console.log('✅ Connected as:', connectedAddress);
             updateWalletUI(connectedAddress);
             showNotification('✅ Wallet connected!', 'success');
             fetchAccountBalance(connectedAddress);
             loadUserVaults();
        },
        onCancel: () => {
             console.log('User cancelled login');
             showNotification('⚠️ Connection cancelled', 'warning');
        }
    });
}

function disconnectWallet() {
    userSession.signUserOut();
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
    if (btn && address) {
        const displayAddr = typeof address === 'string' ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected';
        btn.textContent = displayAddr;
        btn.className = 'btn btn-success';
        btn.onclick = disconnectWallet;
    }
}

// ============================================================
// CORE CONTRACT CALL
// ============================================================

async function callContract({ contract, functionName, functionArgs = [], onSuccess, onCancel, onError }) {
    if (!userSession.isUserSignedIn()) {
        showNotification('⚠️ Please connect your wallet first!', 'warning');
        connectWallet();
        return;
    }

    const lastDot = contract.lastIndexOf('.');
    const contractAddress = contract.substring(0, lastDot);
    const contractName = contract.substring(lastDot + 1);

    console.log(`🚀 Calling ${contractAddress}.${contractName}::${functionName}`);

    try {
        await openContractCall({
            contractAddress,
            contractName,
            functionName,
            functionArgs,
            network: stacksNetwork,
            appDetails,
            userSession,
            anchorMode: AnchorMode.Any,
            postConditionMode: PostConditionMode.Allow,
            onFinish: (data) => {
                console.log('✅ Transaction broadcasted:', data);
                if (onSuccess) onSuccess(data);
            },
            onCancel: () => {
                console.log('❌ Transaction cancelled by user.');
                if (onCancel) onCancel();
            }
        });
    } catch (err) {
        console.error('❌ Error executing openContractCall:', err);
        showNotification('❌ Transaction Error: ' + (err.message || 'Unknown error'), 'error');
        if (onError) onError(err);
    }
}

// ============================================================
// CONTRACT INTERACTIONS
// ============================================================

async function dailyCheckIn() {
    const btn = document.getElementById('checkInBtn');
    if (btn) { btn.textContent = '⏳ Processing...'; btn.disabled = true; }

    const resetBtn = () => { if (btn) { btn.disabled = false; btn.textContent = '✅ Daily Check-in'; } };

    callContract({
        contract: CONTRACT_ADDRESSES.FEB_CHECKIN,
        functionName: 'check-in',
        functionArgs: [],
        onSuccess: () => {
            showNotification('✅ Check-in submitted successfully!', 'success');
            resetBtn();
            updateStats();
            loadLeaderboard();
        },
        onCancel: () => {
            showNotification('⚠️ Check-in cancelled', 'warning');
            resetBtn();
        },
        onError: (err) => {
            console.error('Check-in error:', err);
            showNotification('❌ Check-in failed', 'error');
            resetBtn();
        }
    });
}

async function executeSwap() {
    const amountIn = document.getElementById('swapAmountIn')?.value;
    if (!amountIn || parseFloat(amountIn) <= 0) {
        showNotification('⚠️ Please enter a valid amount', 'warning');
        return;
    }

    const btn = document.getElementById('executeSwapBtn');
    if (btn) { btn.textContent = '⏳ Processing...'; btn.disabled = true; }
    const resetBtn = () => { if (btn) { btn.disabled = false; btn.textContent = 'Swap Tokens'; } };

    callContract({
        contract: CONTRACT_ADDRESSES.SWAP,
        functionName: 'create-swap',
        functionArgs: [], // Simple swap for demo
        onSuccess: () => {
            showNotification('✅ Swap submitted!', 'success');
            resetBtn();
            updateStats();
        },
        onCancel: () => {
            showNotification('⚠️ Swap cancelled', 'warning');
            resetBtn();
        },
        onError: () => resetBtn()
    });
}

function encodeString(str) {
    try {
        return stringAsciiCV(str);
    } catch (e) {
        console.error('Error encoding string:', e);
        return str;
    }
}

async function registerBuilder() {
    const name = document.getElementById('builderName')?.value?.trim();
    const profileUrl = document.getElementById('builderProfile')?.value?.trim();

    if (!name || !profileUrl) {
        showNotification('⚠️ Please fill in all fields', 'warning');
        return;
    }

    const btn = document.getElementById('registerBuilderBtn');
    if (btn) { btn.textContent = '⏳ Processing...'; btn.disabled = true; }
    const resetBtn = () => { if (btn) { btn.disabled = false; btn.textContent = 'Register Builder'; } };

    callContract({
        contract: CONTRACT_ADDRESSES.DEFI_TOOLS,
        functionName: 'register-builder',
        functionArgs: [encodeString(name), encodeString(profileUrl)],
        onSuccess: () => {
            showNotification(`✅ Registered as Builder: ${name}!`, 'success');
            resetBtn();
        },
        onCancel: () => {
            showNotification('⚠️ Registration cancelled', 'warning');
            resetBtn();
        },
        onError: () => resetBtn()
    });
}

// Claim 1 STX from the daily distributor
async function claimDistribution() {
    const btn = document.getElementById('claimDistributionBtn');
    if (btn) { btn.textContent = '⏳ Processing...'; btn.disabled = true; }
    const resetBtn = () => { if (btn) { btn.disabled = false; btn.textContent = '🎁 Claim 1 STX'; } };

    callContract({
        contract: CONTRACT_ADDRESSES.STX_DISTRIBUTOR,
        functionName: 'claim',
        functionArgs: [],
        onSuccess: () => {
            showNotification('✅ 1 STX claimed successfully!', 'success');
            resetBtn();
        },
        onCancel: () => {
            showNotification('⚠️ Claim cancelled', 'warning');
            resetBtn();
        },
        onError: () => resetBtn()
    });
}

// ============================================================
// UI FUNCTIONS
// ============================================================

async function fetchAccountBalance(address) {
    try {
        const response = await fetch(`https://api.hiro.so/extended/v1/address/${address}/balances`);
        if (!response.ok) return;
        const data = await response.json();
        const balance = (parseInt(data.stx.balance) / 1000000).toLocaleString(undefined, {
            minimumFractionDigits: 2, maximumFractionDigits: 2
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

function loadLeaderboard() {
    const tbody = document.getElementById('leaderboardBody');
    if (!tbody) return;
    const mockData = [
        { rank: 1, username: "Aleekhoso 🔵 🟣", score: 28300, streak: 12, contributions: 283, contracts: 200, rewards: "153 STX" },
        { rank: 2, username: "StacksBuilder", score: 15420, streak: 45, contributions: 127, contracts: 85, rewards: "98 STX" },
        { rank: 3, username: "ClarityDev", score: 12850, streak: 38, contributions: 93, contracts: 64, rewards: "82 STX" }
    ];
    tbody.innerHTML = '';
    mockData.forEach((user, index) => {
        const row = document.createElement('tr');
        row.style.animation = `fadeInUp 0.6s ease-out ${index * 0.1}s backwards`;
        const rankClass = user.rank <= 3 ? `rank-badge rank-${user.rank}` : 'rank-badge';
        row.innerHTML = `
            <td><div class="${rankClass}">${user.rank}</div></td>
            <td>
                <div style="font-weight:600">${user.username}</div>
                <div style="font-size:0.75rem;color:var(--text-muted);font-family:monospace">${user.rank === 1 && connectedAddress ? connectedAddress.slice(0, 8) + '...' : 'SP2...'}</div>
            </td>
            <td>
                <div style="font-weight:700;color:#4facfe">${user.score.toLocaleString()}</div>
                <div style="font-size:0.75rem;color:var(--text-muted)">${user.contracts} contracts • ${user.rewards}</div>
            </td>
            <td><span class="badge badge-warning">🔥 ${user.streak} days</span></td>
            <td><div style="font-weight:600;color:#4facfe">${user.contributions}</div></td>
        `;
        tbody.appendChild(row);
    });
}

function loadUserVaults() {
    const container = document.getElementById('myVaults');
    if (!container) return;
    if (!userSession.isUserSignedIn()) {
        container.innerHTML = '<div class="card" style="grid-column:1/-1;text-align:center;color:var(--text-muted)">Connect wallet to view your vaults</div>';
        return;
    }
    const vaults = [
        { name: 'Community Treasury', balance: '2,450 STX', signers: '3/5', apy: '12.5%' },
        { name: 'Development Fund', balance: '1,820 STX', signers: '2/3', apy: '10.2%' }
    ];
    container.innerHTML = vaults.map(v => `
        <div class="card">
            <h4>${v.name}</h4>
            <div style="margin:1rem 0">
                <div style="font-size:0.875rem;color:var(--text-muted)">Balance</div>
                <div style="font-size:1.25rem;font-weight:700;color:#4facfe">${v.balance}</div>
            </div>
            <button class="btn btn-secondary" style="width:100%">Manage</button>
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
    animateValue('totalUsers', 1200, 1247, 1000);
    animateValue('totalVolume', 2300000, 2400000, 1000, v => `$${(v / 1000000).toFixed(1)}M`);
    animateValue('totalLocked', 5600000, 5800000, 1000, v => `$${(v / 1000000).toFixed(1)}M`);
}

// ============================================================
// INIT
// ============================================================

function attachListeners() {
    document.getElementById('connectWalletBtn')?.addEventListener('click', connectWallet);
    document.getElementById('checkInBtn')?.addEventListener('click', dailyCheckIn);
    document.getElementById('executeSwapBtn')?.addEventListener('click', executeSwap);
    document.getElementById('swapAmountIn')?.addEventListener('input', calculateSwapOutput);
    document.getElementById('registerBuilderBtn')?.addEventListener('click', registerBuilder);
    document.getElementById('claimDistributionBtn')?.addEventListener('click', claimDistribution);
}

(function init() {
    console.log('🚀 StacksRank initializing...');
    
    if (userSession.isUserSignedIn()) {
        const userData = userSession.loadUserData();
        connectedAddress = userData.profile.stxAddress.mainnet || userData.profile.stxAddress.testnet || userData.profile.stxAddress;
        if (typeof connectedAddress === 'object') connectedAddress = connectedAddress.address || Object.values(connectedAddress)[0];
        updateWalletUI(connectedAddress);
        fetchAccountBalance(connectedAddress);
    }

    if (document.readyState === 'loading') {
        window.addEventListener('load', () => {
            attachListeners();
            loadLeaderboard();
            updateStats();
            loadUserVaults();
        });
    } else {
        setTimeout(() => {
            attachListeners();
            loadLeaderboard();
            updateStats();
            loadUserVaults();
        }, 100);
    }
})();

