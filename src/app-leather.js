// StacksRank - Leather Wallet Integration
// Using Leather wallet kit for modern wallet connection

// Hardcoded contracts configuration to avoid module import issues in non-module script
const NETWORK = 'testnet'; // or 'mainnet'
const CONTRACT_ADDRESSES = {
    REPUTATION: 'SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.simple-reputation',
    SWAP: 'SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.simple-swap',
    VAULT: 'SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.simple-vault'
};



// Global variables (initialized on load)
let AppConfig, UserSession, showConnect, openContractCall, openSTXTransfer;
let StacksTestnet, StacksMainnet;
let uintCV, principalCV, stringAsciiCV, standardPrincipalCV;

let appConfig;
let userSession;
let network;

// Wallet state
let connectedAddress = null;
let userData = null;

const appDetails = {
    name: 'StacksRank',
    icon: window.location.origin + '/logo.svg',
};

// Leaderboard data
const mockLeaderboardData = [
    {
        rank: 1,
        username: "Aleekhoso 🔵 🟣",
        score: 28300,
        streak: 12,
        contributions: 283,
        contracts: 200,
        rewards: "153 STX"
    },
    {
        rank: 2,
        username: "StacksBuilder",
        score: 15420,
        streak: 45,
        contributions: 127,
        contracts: 85,
        rewards: "98 STX"
    },
    {
        rank: 3,
        username: "ClarityDev",
        score: 12850,
        streak: 38,
        contributions: 93,
        contracts: 64,
        rewards: "82 STX"
    }
];

// Initialize
// We try to attach listeners as soon as possible, and also on DOMContentLoaded
function attachListeners() {
    const connectBtn = document.getElementById('connectWalletBtn');
    if (connectBtn) {
        // Remove old listeners to avoid duplicates if called multiple times
        const newBtn = connectBtn.cloneNode(true);
        connectBtn.parentNode.replaceChild(newBtn, connectBtn);

        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🖱️ "Connect Wallet" button clicked!');
            connectWallet();
        });
        console.log('✅ Connect Wallet listener attached');
    } else {
        console.log('⚠️ Connect Wallet button not found yet');
    }

    // Attach other listeners...
    const checkInBtn = document.getElementById('checkInBtn');
    if (checkInBtn) checkInBtn.onclick = dailyCheckIn;

    const executeSwapBtn = document.getElementById('executeSwapBtn');
    if (executeSwapBtn) executeSwapBtn.onclick = executeSwap;

    // Swap Inputs
    const swapAmountIn = document.getElementById('swapAmountIn');
    if (swapAmountIn) swapAmountIn.addEventListener('input', calculateSwapOutput);

    const swapDirectionBtn = document.getElementById('swapDirectionBtn');
    if (swapDirectionBtn) swapDirectionBtn.addEventListener('click', swapDirection);

    const createVaultBtn = document.getElementById('createVaultBtn');
    if (createVaultBtn) createVaultBtn.onclick = createVault;

    const stakeBtn = document.getElementById('stakeBtn');
    if (stakeBtn) stakeBtn.onclick = stakeInVault;
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOMContentLoaded: Initializing StacksRank...');

    // Attempt to bind Stacks globals
    if (bindStacksGlobals()) {
        console.log('📦 StacksConnect bound on load');
        initializeSession();
    } else {
        console.warn('⏳ StacksConnect not bound on load - will try on click...');
    }

    attachListeners();
    loadLeaderboard();
    updateStats();
    loadUserVaults();
});

function bindStacksGlobals() {
    // Debug: Print available Stacks globals
    const stacksGlobals = Object.keys(window).filter(k => k.toLowerCase().includes('stack') || k.toLowerCase().includes('connect'));
    console.log('🔍 Available Stacks globals:', stacksGlobals);

    // Try finding the correct object
    const Connect = window.StacksConnect || window.connect;
    if (!Connect) return false;

    try {
        ({ openContractCall, openSTXTransfer, showConnect } = Connect);
        ({ StacksTestnet, StacksMainnet } = window.StacksNetwork);
        ({ uintCV, principalCV, stringAsciiCV, standardPrincipalCV } = window.StacksTransactions);

        AppConfig = Connect.AppConfig || window.StacksAuth?.AppConfig;
        UserSession = Connect.UserSession || window.StacksAuth?.UserSession;

        return true;
    } catch (e) {
        console.error('❌ Error binding globals:', e);
        return false;
    }
}

function initializeSession() {
    if (!AppConfig || !UserSession) return;

    appConfig = new AppConfig(['store_write', 'publish_data']);
    userSession = new UserSession({ appConfig });
    network = NETWORK === 'mainnet' ? new StacksMainnet() : new StacksTestnet();

    if (userSession.isUserSignedIn()) {
        try {
            userData = userSession.loadUserData();
            connectedAddress = userData.profile.stxAddress.mainnet;
            if (NETWORK === 'testnet') {
                connectedAddress = userData.profile.stxAddress.testnet || userData.profile.stxAddress.mainnet;
            }
            updateWalletUI(connectedAddress);
            console.log('✅ User already connected:', connectedAddress);
        } catch (e) {
            console.error('Error loading session:', e);
        }
    }
}

// Re-run listener attachment if we missed it
setTimeout(attachListeners, 1000);

// Update wallet UI
function updateWalletUI(address) {
    const connectBtn = document.getElementById('connectWalletBtn');
    if (connectBtn) {
        connectBtn.textContent = `${address.slice(0, 6)}...${address.slice(-4)}`;
        connectBtn.classList.remove('btn-primary');
        connectBtn.classList.add('btn-success');

        // Remove old listeners specifically for connect
        const newBtn = connectBtn.cloneNode(true);
        connectBtn.parentNode.replaceChild(newBtn, connectBtn);
        newBtn.addEventListener('click', disconnectWallet);
    }

    // Fetch and update balance for swap
    fetchAccountBalance(address);
    showNotification(`✅ Connected: ${address.slice(0, 6)}...`, 'success');
}

// Fetch Account Balance
async function fetchAccountBalance(address) {
    try {
        console.log(`💰 Fetching balance for ${address}...`);

        // Use Testnet or Mainnet API based on config (defaulting to Testnet for this demo as per contracts)
        const baseUrl = NETWORK === 'mainnet' ? 'https://api.hiro.so' : 'https://api.testnet.hiro.so';
        const url = `${baseUrl}/extended/v1/address/${address}/balances`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch balance');

        const data = await response.json();
        const stxBalance = data.stx.balance;

        // Convert microSTX to STX
        const balance = (parseInt(stxBalance) / 1000000).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6
        });

        console.log(`💰 Balance: ${balance} STX`);

        // Update UI
        const balanceElement = document.getElementById('balanceIn');
        if (balanceElement) {
            balanceElement.textContent = `${balance} STX`;
            // Add a little animation/highlight
            balanceElement.style.color = '#4facfe';
            balanceElement.style.fontWeight = 'bold';
        }

    } catch (error) {
        console.error('❌ Error fetching balance:', error);
        const balanceElement = document.getElementById('balanceIn');
        if (balanceElement) balanceElement.textContent = '0.00 STX';
    }
}

// Disconnect wallet
function disconnectWallet() {
    connectedAddress = null;
    userData = null;
    if (userSession) userSession.signUserOut();

    const connectBtn = document.getElementById('connectWalletBtn');
    if (connectBtn) {
        connectBtn.textContent = 'Connect Wallet';
        connectBtn.classList.remove('btn-success');
        connectBtn.classList.add('btn-primary');

        const newBtn = connectBtn.cloneNode(true);
        connectBtn.parentNode.replaceChild(newBtn, connectBtn);
        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            connectWallet();
        });
    }

    showNotification('👋 Wallet disconnected', 'info');
}

// Check if user is registered, if not, register them
async function checkAndRegister() {
    if (!connectedAddress) return;
    console.log('✅ Mock check-in for register');
}

// Connect Wallet (Direct Leather Integration)
async function connectWallet() {
    console.log('🔗 Connecting wallet via LeatherProvider...');

    if (!window.LeatherProvider) {
        showNotification('📦 Please install Leather wallet!', 'warning');
        window.open('https://leather.io/install-extension', '_blank');
        return;
    }

    try {
        const response = await window.LeatherProvider.request('getAddresses');

        if (response && response.result && response.result.addresses) {
            const stxAddress = response.result.addresses.find(a => a.symbol === 'STX');

            if (stxAddress) {
                connectedAddress = stxAddress.address;
                userData = { profile: { stxAddress: { mainnet: connectedAddress } } }; // Mock structure for compatibility

                updateWalletUI(connectedAddress);
                showNotification('✅ Wallet connected successfully!', 'success');
                checkAndRegister();
            }
        } else {
            // Fallback for older versions or different response structure
            const accounts = await window.LeatherProvider.request('stx_requestAccounts');
            if (accounts && accounts.result && accounts.result.addresses) {
                connectedAddress = accounts.result.addresses[0].address;
                updateWalletUI(connectedAddress);
                showNotification('✅ Wallet connected successfully!', 'success');
            }
        }
    } catch (error) {
        console.error('❌ Wallet connection error:', error);
        showNotification('❌ Failed to connect wallet', 'error');
    }
}

// Contract Interactions

// Daily check-in
async function dailyCheckIn() {
    if (!connectedAddress) {
        showNotification('⚠️ Please connect your wallet first', 'warning');
        connectWallet();
        return;
    }

    try {
        const btn = document.getElementById('checkInBtn');
        btn.disabled = true;
        btn.textContent = '⏳ Processing...';

        const [contractAddress, contractName] = CONTRACT_ADDRESSES.REPUTATION.split('.');

        // Use Stacks Connect if available for signing, otherwise try Leather directly
        if (openContractCall && appDetails) {
            await openContractCall({
                network,
                contractAddress,
                contractName,
                functionName: 'daily-check-in',
                functionArgs: [],
                appDetails,
                onFinish: (data) => {
                    console.log('✅ Check-in successful!', data);
                    showNotification('✅ Daily check-in successful! +10 points', 'success');
                    btn.disabled = false;
                    btn.textContent = '✅ Daily Check-in';
                    loadLeaderboard();
                },
                onCancel: () => {
                    console.log('❌ User cancelled');
                    showNotification('❌ Check-in cancelled', 'info');
                    btn.disabled = false;
                    btn.textContent = '✅ Daily Check-in';
                }
            });
        } else {
            // Fallback warning
            showNotification('❌ Stacks signing library not loaded', 'error');
            btn.disabled = false;
        }

    } catch (error) {
        console.error('❌ Check-in error:', error);
        showNotification('❌ Check-in failed', 'error');
        const btn = document.getElementById('checkInBtn');
        if (btn) {
            btn.disabled = false;
            btn.textContent = '✅ Daily Check-in';
        }
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

    // Only apply rate if tokens are different
    const finalRate = tokenIn === tokenOut ? 1 : rate;

    const amountOut = (amountIn * finalRate * 0.997).toFixed(6); // 0.3% fee

    document.getElementById('swapAmountOut').value = amountOut > 0 ? amountOut : '';
    document.getElementById('swapRate').textContent = `1 ${tokenIn} = ${finalRate} ${tokenOut}`;
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
    if (!amountIn || amountIn <= 0) {
        showNotification('⚠️ Please enter a valid amount', 'warning');
        return;
    }

    try {
        const btn = document.getElementById('executeSwapBtn');
        btn.disabled = true;
        btn.textContent = '⏳ Swapping...';

        const [contractAddress, contractName] = CONTRACT_ADDRESSES.SWAP.split('.');
        const amount = Math.floor(parseFloat(amountIn) * 1000000); // Convert to microSTX

        if (window.openContractCall) {
            await openContractCall({
                network,
                contractAddress,
                contractName,
                functionName: 'create-swap',
                functionArgs: [
                    principalCV(connectedAddress), // counterparty
                    uintCV(amount),
                    uintCV(144) // 24 hours
                ],
                appDetails,
                onFinish: (data) => {
                    console.log('✅ Swap created!', data);
                    showNotification(`✅ Swap created successfully!`, 'success');
                    document.getElementById('swapAmountIn').value = '';
                    document.getElementById('swapAmountOut').value = '';
                    btn.disabled = false;
                    btn.textContent = 'Swap Tokens';
                    updateStats();
                },
                onCancel: () => {
                    showNotification('❌ Swap cancelled', 'info');
                    btn.disabled = false;
                    btn.textContent = 'Swap Tokens';
                }
            });
        } else {
            // Demo Fallback if Contract Call not available
            console.warn('⚠️ Stacks Connect not found, performing demo swap');
            setTimeout(() => {
                showNotification(`✅ Demo Swap Complete! (Mode: Simulation)`, 'success');
                document.getElementById('swapAmountIn').value = '';
                document.getElementById('swapAmountOut').value = '';
                btn.disabled = false;
                btn.textContent = 'Swap Tokens';
            }, 2000);
        }
    } catch (error) {
        console.error('❌ Swap error:', error);
        showNotification('❌ Swap failed', 'error');
        const btn = document.getElementById('executeSwapBtn');
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Swap Tokens';
        }
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

        const [contractAddress, contractName] = CONTRACT_ADDRESSES.VAULT.split('.');

        await openContractCall({
            network,
            contractAddress,
            contractName,
            functionName: 'create-vault',
            functionArgs: [
                principalCV(connectedAddress), // signer1
                principalCV(connectedAddress), // signer2
                uintCV(2) // required signatures
            ],
            appDetails,
            onFinish: (data) => {
                console.log('✅ Vault created!', data);
                showNotification(`✅ Vault "${vaultName}" created successfully!`, 'success');
                document.getElementById('vaultName').value = '';
                btn.disabled = false;
                btn.textContent = 'Create Vault';
                setTimeout(loadUserVaults, 500);
            },
            onCancel: () => {
                showNotification('❌ Vault creation cancelled', 'info');
                btn.disabled = false;
                btn.textContent = 'Create Vault';
            }
        });
    } catch (error) {
        console.error('❌ Vault creation error:', error);
        showNotification('❌ Failed to create vault', 'error');
        const btn = document.getElementById('createVaultBtn');
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Create Vault';
        }
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

        const [contractAddress, contractName] = CONTRACT_ADDRESSES.VAULT.split('.');
        const stakeAmount = Math.floor(parseFloat(amount) * 1000000);

        await openContractCall({
            network,
            contractAddress,
            contractName,
            functionName: 'deposit',
            functionArgs: [
                uintCV(1), // vault-id
                uintCV(stakeAmount)
            ],
            appDetails,
            onFinish: (data) => {
                console.log('✅ Staked!', data);
                showNotification(`✅ Staked ${amount} STX successfully!`, 'success');
                document.getElementById('stakeAmount').value = '';
                btn.disabled = false;
                btn.textContent = 'Stake Tokens';
                updateStats();
                setTimeout(loadUserVaults, 500);
            },
            onCancel: () => {
                showNotification('❌ Staking cancelled', 'info');
                btn.disabled = false;
                btn.textContent = 'Stake Tokens';
            }
        });
    } catch (error) {
        console.error('❌ Staking error:', error);
        showNotification('❌ Staking failed', 'error');
        const btn = document.getElementById('stakeBtn');
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Stake Tokens';
        }
    }
}

// UI Functions
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
          ${user.rank === 1 && connectedAddress ? connectedAddress.slice(0, 8) + '...' : 'SP...'}
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

function loadUserVaults() {
    const container = document.getElementById('myVaults');
    if (!container) return;

    if (!connectedAddress) {
        container.innerHTML = '<div class="card" style="grid-column: 1 / -1; text-align: center; color: var(--text-muted);">Connect wallet to view your vaults</div>';
        return;
    }

    const vaults = [
        { name: 'Community Treasury', balance: '2,450 STX', signers: '3/5', apy: '12.5%' },
        { name: 'Development Fund', balance: '1,820 STX', signers: '2/3', apy: '10.2%' }
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

console.log('✨ StacksRank with Leather wallet ready!');
