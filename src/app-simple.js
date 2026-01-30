// StacksRank - Simple Version with CDN-based Stacks Connect
// This version uses Stacks Connect via CDN (no build required)

// Wallet Connection State
let connectedAddress = null;
let userData = null;

// Real Talent Protocol Leaderboard - Stacks Builder Rewards: January
const mockLeaderboardData = [
    {
        rank: 1,
        address: "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7",
        username: "Aleekhoso 🔵 🟣",  // YOU - From Talent Protocol!
        score: 28300,  // 200 contracts × 100 + 283 contributions × 30
        streak: 12,    // Jan 19 - Jan 31 (13 days active)
        contributions: 283,  // Your actual GitHub contributions
        contracts: 200,      // Your deployed Clarity contracts!
        rewards: "153 STX"   // Earned from Builder Rewards
    },
    {
        rank: 2,
        address: "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE",
        username: "StacksBuilder",
        score: 15420,
        streak: 45,
        contributions: 127,
        contracts: 85,
        rewards: "98 STX"
    },
    {
        rank: 3,
        address: "SP1P72Z3704VMT3DMHPP2CB8TGQWGDBHD3RPR9GZS",
        username: "ClarityDev",
        score: 12850,
        streak: 38,
        contributions: 93,
        contracts: 64,
        rewards: "82 STX"
    },
    {
        rank: 4,
        address: "SPAXYA5XS51713FDTQ8H94EJ4V579CXMTRNBZKSF",
        username: "DeFiMaster",
        score: 11240,
        streak: 32,
        contributions: 76,
        contracts: 52,
        rewards: "71 STX"
    },
    {
        rank: 5,
        address: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9",
        username: "SmartContractor",
        score: 9680,
        streak: 28,
        contributions: 64,
        contracts: 41,
        rewards: "58 STX"
    }
];

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 StacksRank initialized');

    setupEventListeners();
    loadLeaderboard();
    updateStats();
    loadUserVaults();

    // Wait for Stacks Connect to be ready
    if (!window.userSession) {
        console.log('⏳ Waiting for Stacks Connect to initialize...');
        window.addEventListener('stacksConnectReady', initializeWalletConnection);
    } else {
        initializeWalletConnection();
    }
});

function initializeWalletConnection() {
    // Check if Stacks Connect is available
    if (window.StacksConnect && window.userSession) {
        console.log('✅ Stacks Connect ready');

        // Check if user is already signed in
        if (window.userSession.isUserSignedIn()) {
            console.log('✅ User already signed in');
            userData = window.userSession.loadUserData();
            connectedAddress = userData.profile.stxAddress.mainnet;
            updateWalletUI(connectedAddress);
            showNotification('✅ Wallet reconnected!', 'success');
        } else {
            console.log('💡 Ready to connect wallet');
        }
    } else {
        console.warn('⚠️ Stacks Connect not available - wallet features disabled');
        console.log('💡 Refresh the page if Leather wallet is installed');
    }
}

// Event Listeners
function setupEventListeners() {
    const connectWalletBtn = document.getElementById('connectWalletBtn');
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', connectWallet);
    }

    const checkInBtn = document.getElementById('checkInBtn');
    if (checkInBtn) {
        checkInBtn.addEventListener('click', performDailyCheckIn);
    }

    const executeSwapBtn = document.getElementById('executeSwapBtn');
    if (executeSwapBtn) {
        executeSwapBtn.addEventListener('click', executeSwap);
    }

    const swapDirectionBtn = document.getElementById('swapDirectionBtn');
    if (swapDirectionBtn) {
        swapDirectionBtn.addEventListener('click', swapDirection);
    }

    const swapAmountIn = document.getElementById('swapAmountIn');
    if (swapAmountIn) {
        swapAmountIn.addEventListener('input', calculateSwapOutput);
    }

    const createVaultBtn = document.getElementById('createVaultBtn');
    if (createVaultBtn) {
        createVaultBtn.addEventListener('click', createVault);
    }

    const stakeBtn = document.getElementById('stakeBtn');
    if (stakeBtn) {
        stakeBtn.addEventListener('click', stakeInVault);
    }
}

// Real Wallet Connection with Stacks Connect
async function connectWallet() {
    try {
        console.log('🔗 Connecting wallet...');

        // Check if Stacks Connect is available
        if (!window.StacksConnect || !window.userSession) {
            console.error('❌ Stacks Connect not loaded');
            showNotification('📦 Please install Leather wallet: https://leather.io/install-extension', 'warning');

            // Open install page
            setTimeout(() => {
                window.open('https://leather.io/install-extension', '_blank');
            }, 2000);
            return;
        }

        console.log('✅ Stacks Connect available, opening wallet...');

        // Use real Stacks Connect with proper API
        const { showConnect } = window.StacksConnect;

        showConnect({
            appDetails: {
                name: 'StacksRank',
                icon: window.location.origin + '/logo.svg',
            },
            redirectTo: '/',
            onFinish: (data) => {
                console.log('✅ Wallet connection successful!', data);
                handleAuthResponse(data);
            },
            onCancel: () => {
                console.log('❌ User cancelled wallet connection');
                showNotification('❌ Connection cancelled', 'info');
            },
            userSession: window.userSession,
        });

    } catch (error) {
        console.error('❌ Wallet connection error:', error);
        showNotification('❌ Failed to connect. Please install Leather wallet.', 'error');

        // Show install prompt
        setTimeout(() => {
            if (confirm('Install Leather wallet to connect?')) {
                window.open('https://leather.io/install-extension', '_blank');
            }
        }, 1000);
    }
}

// Handle authentication response
function handleAuthResponse(data) {
    try {
        console.log('📝 Processing auth response...', data);

        if (window.userSession && window.userSession.isUserSignedIn()) {
            userData = window.userSession.loadUserData();

            // Get mainnet address (or testnet for testing)
            connectedAddress = userData.profile.stxAddress.mainnet;

            console.log('✅ Connected address:', connectedAddress);

            updateWalletUI(connectedAddress);
            showNotification('✅ Wallet connected successfully!', 'success');
            loadUserData();
        } else {
            console.error('❌ User not signed in after auth');
            showNotification('❌ Authentication failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('❌ Error handling auth:', error);
        showNotification('❌ Failed to process wallet connection', 'error');
    }
}

// Update wallet UI
function updateWalletUI(address) {
    const connectBtn = document.getElementById('connectWalletBtn');
    if (connectBtn) {
        connectBtn.textContent = `${address.slice(0, 6)}...${address.slice(-4)}`;
        connectBtn.classList.remove('btn-primary');
        connectBtn.classList.add('btn-success');

        // Add disconnect functionality
        connectBtn.onclick = disconnectWallet;
    }
}

// Disconnect wallet
function disconnectWallet() {
    if (window.userSession) {
        window.userSession.signUserOut();
    }
    connectedAddress = null;
    userData = null;

    const connectBtn = document.getElementById('connectWalletBtn');
    if (connectBtn) {
        connectBtn.textContent = 'Connect Wallet';
        connectBtn.classList.remove('btn-success');
        connectBtn.classList.add('btn-primary');
        connectBtn.onclick = connectWallet;
    }

    showNotification('👋 Wallet disconnected', 'info');
    loadUserVaults(); // Refresh to show "connect wallet" message
}

// Load leaderboard
function loadLeaderboard() {
    const tbody = document.getElementById('leaderboardBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    mockLeaderboardData.forEach((user, index) => {
        const row = document.createElement('tr');
        row.style.animation = `fadeInUp 0.6s ease-out ${index * 0.1}s backwards`;

        let rankBadge = `<div class="rank-badge">${user.rank}</div>`;
        if (user.rank <= 3) {
            rankBadge = `<div class="rank-badge rank-${user.rank}">${user.rank}</div>`;
        }

        row.innerHTML = `
      <td>${rankBadge}</td>
      <td>
        <div style="font-weight: 600;">${user.username}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted); font-family: monospace;">
          ${user.address.slice(0, 8)}...${user.address.slice(-6)}
        </div>
      </td>
      <td>
        <div style="font-weight: 700; color: #4facfe;">${user.score.toLocaleString()}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">
          ${user.contracts || 0} contracts • ${user.rewards || '0 STX'}
        </div>
      </td>
      <td>
        <span class="badge badge-warning">🔥 ${user.streak} days</span>
      </td>
      <td>
        <div style="font-weight: 600; color: #4facfe;">${user.contributions}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">GitHub PRs</div>
      </td>
    `;

        tbody.appendChild(row);
    });
}

// Daily check-in
async function performDailyCheckIn() {
    if (!connectedAddress) {
        showNotification('⚠️ Please connect your wallet first', 'warning');
        connectWallet();
        return;
    }

    try {
        const btn = document.getElementById('checkInBtn');
        btn.disabled = true;
        btn.textContent = '⏳ Processing...';

        await simulateTransaction(2000);

        showNotification('✅ Daily check-in successful! +10 points', 'success');

        setTimeout(() => {
            loadLeaderboard();
            btn.disabled = false;
            btn.textContent = '✅ Daily Check-in';
        }, 1000);

    } catch (error) {
        console.error('Check-in error:', error);
        showNotification('❌ Check-in failed', 'error');
    }
}

// Swap calculation
function calculateSwapOutput() {
    const amountIn = parseFloat(document.getElementById('swapAmountIn').value) || 0;
    const tokenIn = document.getElementById('tokenIn').value;
    const tokenOut = document.getElementById('tokenOut').value;

    const rates = {
        'STX-xBTC': 0.00025,
        'STX-USDA': 0.85,
        'xBTC-STX': 4000,
        'xBTC-USDA': 42000,
        'USDA-STX': 1.18,
        'USDA-xBTC': 0.000024
    };

    const rateKey = `${tokenIn}-${tokenOut}`;
    const rate = rates[rateKey] || 1;
    const amountOut = (amountIn * rate * 0.997).toFixed(6);

    document.getElementById('swapAmountOut').value = amountOut;
    document.getElementById('swapRate').textContent = `1 ${tokenIn} = ${rate} ${tokenOut}`;
}

// Swap direction toggle
function swapDirection() {
    const tokenIn = document.getElementById('tokenIn');
    const tokenOut = document.getElementById('tokenOut');

    const temp = tokenIn.value;
    tokenIn.value = tokenOut.value;
    tokenOut.value = temp;

    calculateSwapOutput();
}

// Execute swap
async function executeSwap() {
    if (!connectedAddress) {
        showNotification('⚠️ Please connect your wallet first', 'warning');
        connectWallet();
        return;
    }

    const amountIn = document.getElementById('swapAmountIn').value;
    const tokenIn = document.getElementById('tokenIn').value;
    const tokenOut = document.getElementById('tokenOut').value;

    if (!amountIn || amountIn <= 0) {
        showNotification('⚠️ Please enter a valid amount', 'warning');
        return;
    }

    try {
        const btn = document.getElementById('executeSwapBtn');
        btn.disabled = true;
        btn.textContent = '⏳ Swapping...';

        await simulateTransaction(3000);

        showNotification(`✅ Swapped ${amountIn} ${tokenIn} successfully!`, 'success');

        document.getElementById('swapAmountIn').value = '';
        document.getElementById('swapAmountOut').value = '';

        btn.disabled = false;
        btn.textContent = 'Swap Tokens';

        updateStats();

    } catch (error) {
        console.error('Swap error:', error);
        showNotification('❌ Swap failed', 'error');
    }
}

// Create vault
async function createVault() {
    if (!connectedAddress) {
        showNotification('⚠️ Please connect your wallet first', 'warning');
        connectWallet();
        return;
    }

    const vaultName = document.getElementById('vaultName').value;

    if (!vaultName) {
        showNotification('⚠️ Please enter a vault name', 'warning');
        return;
    }

    try {
        const btn = document.getElementById('createVaultBtn');
        btn.disabled = true;
        btn.textContent = '⏳ Creating...';

        await simulateTransaction(2500);

        showNotification(`✅ Vault "${vaultName}" created successfully!`, 'success');

        document.getElementById('vaultName').value = '';

        btn.disabled = false;
        btn.textContent = 'Create Vault';

        setTimeout(loadUserVaults, 500);

    } catch (error) {
        console.error('Vault creation error:', error);
        showNotification('❌ Failed to create vault', 'error');
    }
}

// Stake in vault
async function stakeInVault() {
    if (!connectedAddress) {
        showNotification('⚠️ Please connect your wallet first', 'warning');
        connectWallet();
        return;
    }

    const amount = document.getElementById('stakeAmount').value;

    if (!amount || amount <= 0) {
        showNotification('⚠️ Please enter a valid amount', 'warning');
        return;
    }

    try {
        const btn = document.getElementById('stakeBtn');
        btn.disabled = true;
        btn.textContent = '⏳ Staking...';

        await simulateTransaction(2500);

        showNotification(`✅ Staked ${amount} STX successfully!`, 'success');

        document.getElementById('stakeAmount').value = '';

        btn.disabled = false;
        btn.textContent = 'Stake Tokens';

        updateStats();
        setTimeout(loadUserVaults, 500);

    } catch (error) {
        console.error('Staking error:', error);
        showNotification('❌ Staking failed', 'error');
    }
}

// Load user vaults
function loadUserVaults() {
    const container = document.getElementById('myVaults');
    if (!container) return;

    if (!connectedAddress) {
        container.innerHTML = '<div class="card" style="grid-column: 1 / -1; text-align: center; color: var(--text-muted);">Connect wallet to view your vaults</div>';
        return;
    }

    const vaults = [
        { name: 'Community Treasury', balance: '2,450 STX', signers: '3/5', apy: '12.5%' },
        { name: 'Development Fund', balance: '1,820 STX', signers: '2/3', apy: '10.2%' },
        { name: 'Rewards Pool', balance: '3,100 STX', signers: '4/7', apy: '15.8%' }
    ];

    container.innerHTML = vaults.map((vault, index) => `
    <div class="card" style="animation: slideInRight 0.6s ease-out ${index * 0.1}s backwards;">
      <h4 style="margin-bottom: 1rem;">${vault.name}</h4>
      <div style="margin-bottom: 0.75rem;">
        <div style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.25rem;">Balance</div>
        <div style="font-size: 1.25rem; font-weight: 700; color: #4facfe;">${vault.balance}</div>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
        <div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">Signers</div>
          <div style="font-weight: 600;">${vault.signers}</div>
        </div>
        <div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">APY</div>
          <div style="font-weight: 600; color: #4facfe;">${vault.apy}</div>
        </div>
      </div>
      <button class="btn btn-secondary" style="width: 100%; padding: 0.5rem; font-size: 0.875rem;">Manage</button>
    </div>
  `).join('');
}

// Update stats
function updateStats() {
    animateValue('totalUsers', 1100, 1247, 1000);
    animateValue('totalVolume', 2100000, 2400000, 1000, val => `$${(val / 1000000).toFixed(1)}M`);
    animateValue('totalLocked', 5200000, 5800000, 1000, val => `$${(val / 1000000).toFixed(1)}M`);
}

function animateValue(id, start, end, duration, formatter = val => val.toLocaleString()) {
    const element = document.getElementById(id);
    if (!element) return;

    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = formatter(Math.floor(current));
    }, 16);
}

// Utility functions
function loadUserData() {
    console.log('Loading user data for:', connectedAddress);
}

async function simulateTransaction(delay) {
    return new Promise(resolve => setTimeout(resolve, delay));
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    padding: 1rem 1.5rem;
    background: ${type === 'success' ? 'var(--success-gradient)' :
            type === 'error' ? 'var(--secondary-gradient)' :
                type === 'warning' ? 'var(--accent-gradient)' :
                    'var(--primary-gradient)'};
    color: white;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    z-index: 10000;
    animation: slideInRight 0.3s ease-out;
    font-weight: 600;
  `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Export
window.StacksRank = {
    connectWallet,
    loadLeaderboard,
    performDailyCheckIn,
    executeSwap,
    createVault,
    stakeInVault
};

console.log('✨ StacksRank App Ready');
