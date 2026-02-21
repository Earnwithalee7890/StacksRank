// StacksRank - Main Application JavaScript
// Integrates with Stacks blockchain via Stacks.js

// Wallet Connection State
let userSession = null;
let userData = null;
let connectedAddress = null;

// Mock data for demonstration (replace with actual blockchain calls)
const mockLeaderboardData = [
  {
    rank: 1,
    address: "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7",
    username: "StacksBuilder",
    score: 15420,
    streak: 45,
    contributions: 127
  },
  {
    rank: 2,
    address: "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE",
    username: "ClarityDev",
    score: 12850,
    streak: 38,
    contributions: 93
  },
  {
    rank: 3,
    address: "SP1P72Z3704VMT3DMHPP2CB8TGQWGDBHD3RPR9GZS",
    username: "DeFiMaster",
    score: 11240,
    streak: 32,
    contributions: 76
  },
  {
    rank: 4,
    address: "SPAXYA5XS51713FDTQ8H94EJ4V579CXMTRNBZKSF",
    username: "SmartContractor",
    score: 9680,
    streak: 28,
    contributions: 64
  },
  {
    rank: 5,
    address: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9",
    username: "EcosystemChamp",
    score: 8420,
    streak: 25,
    contributions: 58
  }
];

// Initialize app on page load
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 StacksRank initialized');
  
  // Setup event listeners
  setupEventListeners();
  
  // Load initial data
  loadLeaderboard();
  updateStats();
  loadUserVaults();
  
  // Check for existing wallet connection
  checkWalletConnection();
});

// Event Listeners Setup
function setupEventListeners() {
  // Wallet connection
  const connectWalletBtn = document.getElementById('connectWalletBtn');
  if (connectWalletBtn) {
    connectWalletBtn.addEventListener('click', connectWallet);
  }
  
  // Daily check-in
  const checkInBtn = document.getElementById('checkInBtn');
  if (checkInBtn) {
    checkInBtn.addEventListener('click', performDailyCheckIn);
  }
  
  // Swap functionality
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
  
  // Vault functionality
  const createVaultBtn = document.getElementById('createVaultBtn');
  if (createVaultBtn) {
    createVaultBtn.addEventListener('click', createVault);
  }
  
  const stakeBtn = document.getElementById('stakeBtn');
  if (stakeBtn) {
    stakeBtn.addEventListener('click', stakeInVault);
  }
}

// Wallet Connection
async function connectWallet() {
  try {
    console.log('Connecting wallet...');
    
    // In production, use Stacks Connect
    // For demo purposes, simulate connection
    connectedAddress = "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7";
    
    // Update UI
    const connectBtn = document.getElementById('connectWalletBtn');
    if (connectBtn) {
      connectBtn.textContent = `${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}`;
      connectBtn.classList.remove('btn-primary');
      connectBtn.classList.add('btn-success');
    }
    
    showNotification('✅ Wallet connected successfully!', 'success');
    
    // Load user-specific data
    loadUserData();
  } catch (error) {
    console.error('Wallet connection error:', error);
    showNotification('❌ Failed to connect wallet', 'error');
  }
}

function checkWalletConnection() {
  // Check if wallet was previously connected
  // In production, check localStorage or Stacks Connect state
  console.log('Checking for existing wallet connection...');
}

// Leaderboard Functions
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
        <div class="progress-bar" style="margin-top: 0.25rem; width: 120px;">
          <div class="progress-fill" style="width: ${Math.min(user.score / 200, 100)}%"></div>
        </div>
      </td>
      <td>
        <span class="badge badge-warning">🔥 ${user.streak} days</span>
      </td>
      <td>
        <span style="font-weight: 600;">${user.contributions}</span> PRs
      </td>
    `;
    
    tbody.appendChild(row);
  });
}

async function performDailyCheckIn() {
  if (!connectedAddress) {
    showNotification('⚠️ Please connect your wallet first', 'warning');
    return;
  }
  
  try {
    const btn = document.getElementById('checkInBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Processing...';
    
    // Simulate blockchain transaction
    await simulateTransaction(2000);
    
    // In production, call the contract:
    // await callContract('daily-check-in', []);
    
    showNotification('✅ Daily check-in successful! +10 points', 'success');
    
    // Update leaderboard
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

// Swap Functions
function calculateSwapOutput() {
  const amountIn = parseFloat(document.getElementById('swapAmountIn').value) || 0;
  const tokenIn = document.getElementById('tokenIn').value;
  const tokenOut = document.getElementById('tokenOut').value;
  
  // Mock exchange rates
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
  
  const amountOut = (amountIn * rate * 0.997).toFixed(6); // 0.3% fee
  
  document.getElementById('swapAmountOut').value = amountOut;
  document.getElementById('swapRate').textContent = `1 ${tokenIn} = ${rate} ${tokenOut}`;
}

function swapDirection() {
  const tokenIn = document.getElementById('tokenIn');
  const tokenOut = document.getElementById('tokenOut');
  
  const temp = tokenIn.value;
  tokenIn.value = tokenOut.value;
  tokenOut.value = temp;
  
  calculateSwapOutput();
}

async function executeSwap() {
  if (!connectedAddress) {
    showNotification('⚠️ Please connect your wallet first', 'warning');
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
    
    // Simulate blockchain transaction
    await simulateTransaction(3000);
    
    // In production, call the swap contract
    
    showNotification(`✅ Swapped ${amountIn} ${tokenIn} successfully!`, 'success');
    
    // Reset form
    document.getElementById('swapAmountIn').value = '';
    document.getElementById('swapAmountOut').value = '';
    
    btn.disabled = false;
    btn.textContent = 'Swap Tokens';
    
    // Update stats
    updateStats();
    
  } catch (error) {
    console.error('Swap error:', error);
    showNotification('❌ Swap failed', 'error');
  }
}

// Vault Functions
async function createVault() {
  if (!connectedAddress) {
    showNotification('⚠️ Please connect your wallet first', 'warning');
    return;
  }
  
  const vaultName = document.getElementById('vaultName').value;
  const requiredSigs = document.getElementById('requiredSigs').value;
  const timeLock = document.getElementById('timeLock').value;
  
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
    
    // Reset form
    document.getElementById('vaultName').value = '';
    
    btn.disabled = false;
    btn.textContent = 'Create Vault';
    
    // Reload vaults
    setTimeout(loadUserVaults, 500);
    
  } catch (error) {
    console.error('Vault creation error:', error);
    showNotification('❌ Failed to create vault', 'error');
  }
}

async function stakeInVault() {
  if (!connectedAddress) {
    showNotification('⚠️ Please connect your wallet first', 'warning');
    return;
  }
  
  const amount = document.getElementById('stakeAmount').value;
  const duration = document.getElementById('lockDuration').value;
  
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
    
    // Reset form
    document.getElementById('stakeAmount').value = '';
    
    btn.disabled = false;
    btn.textContent = 'Stake Tokens';
    
    // Update stats and vaults
    updateStats();
    setTimeout(loadUserVaults, 500);
    
  } catch (error) {
    console.error('Staking error:', error);
    showNotification('❌ Staking failed', 'error');
  }
}

function loadUserVaults() {
  const container = document.getElementById('myVaults');
  if (!container) return;
  
  if (!connectedAddress) {
    container.innerHTML = '<div class="card" style="grid-column: 1 / -1; text-align: center; color: var(--text-muted);">Connect wallet to view your vaults</div>';
    return;
  }
  
  // Mock vault data
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

// Stats Updates
function updateStats() {
  // Animate numbers
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

// Utility Functions
function loadUserData() {
  console.log('Loading user data for:', connectedAddress);
  // Load user-specific leaderboard position, vaults, etc.
}

async function simulateTransaction(delay) {
  return new Promise(resolve => setTimeout(resolve, delay));
}

function showNotification(message, type = 'info') {
  // Create notification element
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
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Export for use in other modules
window.StacksRank = {
  connectWallet,
  loadLeaderboard,
  performDailyCheckIn,
  executeSwap,
  createVault,
  stakeInVault
};

console.log('✨ StacksRank App Ready');
