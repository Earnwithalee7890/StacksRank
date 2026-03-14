// StacksRank - Leather Wallet Integration (v1.0.1 - Fresh Build)
// Uses @stacks/connect openContractCall for wallet popups (the standard proven approach).
// Uses window.LeatherProvider ONLY for address fetching.

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

// StacksMainnet object from CDN
let stacksNetwork = null;

// ============================================================
// STATE
// ============================================================
let connectedAddress = null;

// ============================================================
// LEADERBOARD DATA
// ============================================================
const mockLeaderboardData = [
    { rank: 1, username: "Aleekhoso 🔵 🟣", score: 28300, streak: 12, contributions: 283, contracts: 200, rewards: "153 STX" },
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
// NETWORK SETUP
// ============================================================
function getNetwork() {
    if (stacksNetwork) return stacksNetwork;
    
    // Robust Network detection
    const StacksMainnet = 
        window.stacks?.network?.StacksMainnet || 
        window.StacksNetwork?.StacksMainnet || 
        window.StacksMainnet ||
        window.Stacks?.Network?.StacksMainnet;
        
    if (StacksMainnet) {
        stacksNetwork = new StacksMainnet();
    } else {
        console.warn('⚠️ Could not find StacksMainnet class, defaulting to mock-like behavior');
    }
    return stacksNetwork;
}

// ============================================================
// WALLET CONNECTION
// ============================================================

async function connectWallet() {
    console.log('🔗 Connecting wallet...');

    if (!window.LeatherProvider) {
        showNotification('📦 Please install Leather wallet extension!', 'warning');
        window.open('https://leather.io/install-extension', '_blank');
        return;
    }

    try {
        const response = await window.LeatherProvider.request('getAddresses');
        console.log('📬 getAddresses response:', response);

        let stxAddr = null;

        if (response?.result?.addresses) {
            const found = response.result.addresses.find(a => a.symbol === 'STX');
            if (found) stxAddr = found.address;
        }

        if (!stxAddr && response?.result?.addresses?.[0]) {
            stxAddr = response.result.addresses[0].address;
        }

        if (stxAddr) {
            connectedAddress = stxAddr;
            updateWalletUI(stxAddr);
            showNotification('✅ Wallet connected: ' + stxAddr.slice(0, 8) + '...', 'success');
            fetchAccountBalance(stxAddr);
        } else {
            showNotification('❌ Could not get STX address', 'error');
        }

    } catch (error) {
        console.error('❌ Wallet connection error:', error);
        showNotification('❌ Failed to connect: ' + (error.message || error), 'error');
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
// CORE CONTRACT CALL — Uses standard openContractCall
// This is the most reliable way to trigger the wallet popup.
// ============================================================

function callContract({ contract, functionName, functionArgs = [], onSuccess, onCancel }) {
    if (!connectedAddress) {
        showNotification('⚠️ Please connect your wallet first!', 'warning');
        connectWallet();
        return;
    }

    // Split 'SP...address.contract-name' into parts
    const lastDot = contract.lastIndexOf('.');
    const contractAddress = contract.substring(0, lastDot);
    const contractName = contract.substring(lastDot + 1);

    console.log(`🚀 Calling ${contractAddress}.${contractName}::${functionName}`);

    // DEFINITIVE DETECTION (Via ESM Bridge)
    const openContractCall = 
        window.stacks?.connect?.openContractCall || 
        window.StacksConnect?.openContractCall;

    if (!openContractCall) {
        console.warn('⚠️ Stacks libraries not ready yet, waiting...');
        showNotification('⏳ Initializing wallet connection...', 'info');
        // If not found immediately, we can wait or tell the user to try again in 1s
        setTimeout(() => {
             if (window.stacks?.connect?.openContractCall) {
                 showNotification('✅ Connection ready!', 'success');
             }
        }, 1000);
        
        if (onCancel) onCancel();
        return;
    }

    // V6/V7 Constants Extraction
    const transactions = window.stacks?.transactions || window.StacksTransactions || {};
    const AnchorModeAny = transactions.AnchorMode?.Any ?? 0x03;
    const PostConditionModeAllow = transactions.PostConditionMode?.Allow ?? 0x01;
    
    // Get Network
    const network = getNetwork();

    try {
        openContractCall({
            contractAddress,
            contractName,
            functionName,
            functionArgs,
            network,
            appDetails,
            anchorMode: AnchorModeAny,
            postConditionMode: PostConditionModeAllow,
            onFinish: (data) => {
                console.log('✅ Success! Transaction broadcasted.', data);
                if (onSuccess) onSuccess(data);
            },
            onCancel: () => {
                console.log('❌ Transaction cancelled by user.');
                if (onCancel) onCancel();
            }
        });
    } catch (err) {
        console.error('❌ Error executing openContractCall:', err);
        showNotification('❌ Failsafe triggered: Could not open wallet popup.', 'error');
        if (onCancel) onCancel();
    }
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
    if (btn) { btn.textContent = '⏳ Processing...'; btn.disabled = true; }

    const btnTimeout = setTimeout(() => {
        if (btn && btn.textContent.includes('Processing')) {
            btn.disabled = false;
            btn.textContent = '✅ Daily Check-in';
            showNotification('🕒 Transaction timeout. Please check your wallet.', 'warning');
        }
    }, 60000);

    callContract({
        contract: CONTRACT_ADDRESSES.FEB_CHECKIN,
        functionName: 'check-in',
        functionArgs: [],
        onSuccess: () => {
            clearTimeout(btnTimeout);
            showNotification('✅ Check-in submitted successfully!', 'success');
            if (btn) { btn.disabled = false; btn.textContent = '✅ Daily Check-in'; }
            loadLeaderboard();
        },
        onCancel: () => {
            clearTimeout(btnTimeout);
            showNotification('⚠️ Check-in cancelled', 'warning');
            if (btn) { btn.disabled = false; btn.textContent = '✅ Daily Check-in'; }
        }
    });
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
    if (btn) { btn.textContent = '⏳ Processing...'; btn.disabled = true; }

    const btnTimeout = setTimeout(() => {
        if (btn && btn.textContent.includes('Processing')) {
            btn.disabled = false;
            btn.textContent = 'Swap Tokens';
            showNotification('🕒 Swap timeout. Please check your wallet.', 'warning');
        }
    }, 60000);

    callContract({
        contract: CONTRACT_ADDRESSES.SWAP,
        functionName: 'create-swap',
        functionArgs: [],
        onSuccess: () => {
            clearTimeout(btnTimeout);
            showNotification('✅ Swap submitted!', 'success');
            if (btn) { btn.disabled = false; btn.textContent = 'Swap Tokens'; }
            updateStats();
        },
        onCancel: () => {
            clearTimeout(btnTimeout);
            showNotification('⚠️ Swap cancelled', 'warning');
            if (btn) { btn.disabled = false; btn.textContent = 'Swap Tokens'; }
        }
    });
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
    if (btn) { btn.textContent = '⏳ Processing...'; btn.disabled = true; }

    const btnTimeout = setTimeout(() => {
        if (btn && btn.textContent.includes('Processing')) {
            btn.disabled = false;
            btn.textContent = 'Create Vault';
            showNotification('🕒 Creation timeout. Please check your wallet.', 'warning');
        }
    }, 60000);

    callContract({
        contract: CONTRACT_ADDRESSES.VAULT,
        functionName: 'create-vault',
        functionArgs: [],
        onSuccess: () => {
            clearTimeout(btnTimeout);
            showNotification(`✅ Vault "${vaultName}" created!`, 'success');
            if (btn) { btn.disabled = false; btn.textContent = 'Create Vault'; }
            setTimeout(loadUserVaults, 500);
        },
        onCancel: () => {
            clearTimeout(btnTimeout);
            showNotification('⚠️ Vault creation cancelled', 'warning');
            if (btn) { btn.disabled = false; btn.textContent = 'Create Vault'; }
        }
    });
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
    if (btn) { btn.textContent = '⏳ Processing...'; btn.disabled = true; }

    const btnTimeout = setTimeout(() => {
        if (btn && btn.textContent.includes('Processing')) {
            btn.disabled = false;
            btn.textContent = 'Stake Tokens';
            showNotification('🕒 Stake timeout. Please check your wallet.', 'warning');
        }
    }, 60000);

    callContract({
        contract: CONTRACT_ADDRESSES.VAULT,
        functionName: 'deposit',
        functionArgs: [],
        onSuccess: () => {
            clearTimeout(btnTimeout);
            showNotification(`✅ Staked ${amount} STX!`, 'success');
            if (btn) { btn.disabled = false; btn.textContent = 'Stake Tokens'; }
            updateStats();
        },
        onCancel: () => {
            clearTimeout(btnTimeout);
            showNotification('⚠️ Stake cancelled', 'warning');
            if (btn) { btn.disabled = false; btn.textContent = 'Stake Tokens'; }
        }
    });
}

// ============================================================
// BUILDER TOOLS
// ============================================================

function encodeStringAscii(str) {
    const stringAsciiCV = 
        window.stacks?.transactions?.stringAsciiCV || 
        window.StacksTransactions?.stringAsciiCV;
        
    if (stringAsciiCV) {
        return stringAsciiCV(str);
    }
    
    console.error('❌ StacksTransactions.stringAsciiCV not found!');
    return str; // Fallback to raw string (might fail on-chain)
}

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
    if (btn) { btn.textContent = '⏳ Processing...'; btn.disabled = true; }

    const btnTimeout = setTimeout(() => {
        if (btn && btn.textContent.includes('Processing')) {
            btn.disabled = false;
            btn.textContent = 'Register Builder';
            showNotification('🕒 Registration timeout. Please check your wallet.', 'warning');
        }
    }, 60000);

    callContract({
        contract: CONTRACT_ADDRESSES.DEFI_TOOLS,
        functionName: 'register-builder',
        functionArgs: [encodeStringAscii(name), encodeStringAscii(profileUrl)],
        onSuccess: () => {
            clearTimeout(btnTimeout);
            showNotification(`✅ Registered as Builder: ${name}!`, 'success');
            if (btn) { btn.disabled = false; btn.textContent = 'Register Builder'; }
            document.getElementById('builderName').value = '';
            document.getElementById('builderProfile').value = '';
        },
        onCancel: () => {
            clearTimeout(btnTimeout);
            showNotification('⚠️ Registration cancelled', 'warning');
            if (btn) { btn.disabled = false; btn.textContent = 'Register Builder'; }
        }
    });
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
    if (btn) { btn.textContent = '⏳ Processing...'; btn.disabled = true; }

    const btnTimeout = setTimeout(() => {
        if (btn && btn.textContent.includes('Processing')) {
            btn.disabled = false;
            btn.textContent = 'Update Status';
            showNotification('🕒 Status update timeout. Please check your wallet.', 'warning');
        }
    }, 60000);

    callContract({
        contract: CONTRACT_ADDRESSES.DEFI_TOOLS,
        functionName: 'update-status',
        functionArgs: [encodeStringAscii(status)],
        onSuccess: () => {
            clearTimeout(btnTimeout);
            showNotification('✅ Status updated!', 'success');
            if (btn) { btn.disabled = false; btn.textContent = 'Update Status'; }
            document.getElementById('builderStatus').value = '';
        },
        onCancel: () => {
            clearTimeout(btnTimeout);
            showNotification('⚠️ Status update cancelled', 'warning');
            if (btn) { btn.disabled = false; btn.textContent = 'Update Status'; }
        }
    });
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
    if (btn) { btn.textContent = '⏳ Processing...'; btn.disabled = true; }

    const btnTimeout = setTimeout(() => {
        if (btn && btn.textContent.includes('Processing')) {
            btn.disabled = false;
            btn.textContent = 'Request Service';
            showNotification('🕒 Service request timeout. Please check your wallet.', 'warning');
        }
    }, 60000);

    callContract({
        contract: CONTRACT_ADDRESSES.DEFI_TOOLS,
        functionName: 'request-service',
        functionArgs: [encodeStringAscii(serviceType), encodeStringAscii(details)],
        onSuccess: () => {
            clearTimeout(btnTimeout);
            showNotification('✅ Service requested!', 'success');
            if (btn) { btn.disabled = false; btn.textContent = 'Request Service'; }
            document.getElementById('serviceDetails').value = '';
        },
        onCancel: () => {
            clearTimeout(btnTimeout);
            showNotification('⚠️ Service request cancelled', 'warning');
            if (btn) { btn.disabled = false; btn.textContent = 'Request Service'; }
        }
    });
}

async function payProtocolFee() {
    if (!connectedAddress) {
        showNotification('⚠️ Please connect your wallet first', 'warning');
        connectWallet();
        return;
    }

    const btn = document.getElementById('payFeeBtn');
    if (btn) { btn.textContent = '⏳ Processing...'; btn.disabled = true; }

    const btnTimeout = setTimeout(() => {
        if (btn && btn.textContent.includes('Processing')) {
            btn.disabled = false;
            btn.textContent = 'Pay 0.02 STX Fee';
            showNotification('🕒 Payment timeout. Please check your wallet.', 'warning');
        }
    }, 60000);

    callContract({
        contract: CONTRACT_ADDRESSES.FEE_DISTRIBUTOR,
        functionName: 'pay-fee',
        functionArgs: [],
        onSuccess: () => {
            clearTimeout(btnTimeout);
            showNotification('✅ Fee of 0.02 STX paid!', 'success');
            if (btn) { btn.disabled = false; btn.textContent = 'Pay 0.02 STX Fee'; }
        },
        onCancel: () => {
            clearTimeout(btnTimeout);
            showNotification('⚠️ Payment cancelled', 'warning');
            if (btn) { btn.disabled = false; btn.textContent = 'Pay 0.02 STX Fee'; }
        }
    });
}

// Claim 1 STX from the daily distributor
async function claimDistribution() {
    if (!connectedAddress) {
        showNotification('⚠️ Please connect your wallet first', 'warning');
        connectWallet();
        return;
    }

    const btn = document.getElementById('claimDistributionBtn');
    if (btn) { btn.textContent = '⏳ Processing...'; btn.disabled = true; }

    const btnTimeout = setTimeout(() => {
        if (btn && btn.textContent.includes('Processing')) {
            btn.disabled = false;
            btn.textContent = '🎁 Claim 1 STX';
            showNotification('🕒 Distribution timeout. Please check your wallet.', 'warning');
        }
    }, 60000);

    callContract({
        contract: CONTRACT_ADDRESSES.STX_DISTRIBUTOR,
        functionName: 'claim',
        functionArgs: [],
        onSuccess: () => {
            clearTimeout(btnTimeout);
            showNotification('✅ 1 STX claimed successfully! Check your wallet.', 'success');
            if (btn) { btn.disabled = false; btn.textContent = '🎁 Claim 1 STX'; }
        },
        onCancel: () => {
            clearTimeout(btnTimeout);
            showNotification('⚠️ Claim cancelled. Try again after 24 hours.', 'warning');
            if (btn) { btn.disabled = false; btn.textContent = '🎁 Claim 1 STX'; }
        }
    });
}

// ============================================================
// UI FUNCTIONS
// ============================================================

async function fetchAccountBalance(address) {
    try {
        const baseUrl = 'https://api.hiro.so';
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
                <div style="font-size:0.75rem;color:var(--text-muted)">${user.contracts} contracts • ${user.rewards}</div>
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

    const registerBuilderBtn = document.getElementById('registerBuilderBtn');
    if (registerBuilderBtn) registerBuilderBtn.onclick = registerBuilder;

    const updateStatusBtn = document.getElementById('updateStatusBtn');
    if (updateStatusBtn) updateStatusBtn.onclick = updateBuilderStatus;

    const requestServiceBtn = document.getElementById('requestServiceBtn');
    if (requestServiceBtn) requestServiceBtn.onclick = requestBuilderService;

    const payFeeBtn = document.getElementById('payFeeBtn');
    if (payFeeBtn) payFeeBtn.onclick = payProtocolFee;

    const claimDistributionBtn = document.getElementById('claimDistributionBtn');
    if (claimDistributionBtn) claimDistributionBtn.onclick = claimDistribution;
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 StacksRank initializing...');
    console.log('🔍 LeatherProvider available:', !!window.LeatherProvider);
    console.log('🔍 StacksConnect available:', !!window.StacksConnect);
    console.log('🔍 Connect available:', !!window.Connect);

    attachListeners();
    loadLeaderboard();
    updateStats();
    loadUserVaults();
});

console.log('✨ StacksRank app-leather.js loaded!');
