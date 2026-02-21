// Real Stacks Connect Integration
// This file handles actual wallet connections with Leather and Hiro wallets

import { AppConfig, UserSession, showConnect } from '@stacks/connect';
import { StacksTestnet, StacksMainnet } from '@stacks/network';

// Configuration
const appConfig = new AppConfig(['store_write', 'publish_data']);
export const userSession = new UserSession({ appConfig });

// Network configuration (change to mainnet for production)
export const network = new StacksMainnet();
// export const network = new StacksTestnet(); // Use for testing

// App details for wallet connection
const appDetails = {
    name: 'StacksRank',
    icon: window.location.origin + '/logo.png', // Add your logo
};

/**
 * Connect wallet using Stacks Connect
 * Works with Leather, Hiro, and other Stacks wallets
 */
export async function connectStacksWallet() {
    return new Promise((resolve, reject) => {
        showConnect({
            appDetails,
            redirectTo: '/',
            onFinish: () => {
                // Get user data after connection
                const userData = userSession.loadUserData();
                const address = userData.profile.stxAddress.mainnet; // or .testnet

                resolve({
                    address: address,
                    userData: userData,
                    publicKey: userData.profile.stxAddress.publicKey
                });
            },
            onCancel: () => {
                reject(new Error('User cancelled wallet connection'));
            },
            userSession,
        });
    });
}

/**
 * Disconnect wallet
 */
export function disconnectWallet() {
    userSession.signUserOut();
    window.location.reload();
}

/**
 * Check if wallet is already connected
 */
export function isWalletConnected() {
    return userSession.isUserSignedIn();
}

/**
 * Get connected wallet address
 */
export function getWalletAddress() {
    if (userSession.isUserSignedIn()) {
        const userData = userSession.loadUserData();
        return userData.profile.stxAddress.mainnet; // or .testnet
    }
    return null;
}

/**
 * Get user data
 */
export function getUserData() {
    if (userSession.isUserSignedIn()) {
        return userSession.loadUserData();
    }
    return null;
}
