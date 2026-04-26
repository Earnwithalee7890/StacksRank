/**
 * StacksRank - Network Configuration
 */

(function() {
    const NETWORK_CONFIG = {
        mainnet: {
            api: 'https://api.mainnet.hiro.so',
            explorer: 'https://explorer.hiro.so',
            chainId: 1
        },
        testnet: {
            api: 'https://api.testnet.hiro.so',
            explorer: 'https://explorer.hiro.so',
            chainId: 2147483648
        }
    };

    const CURRENT_NETWORK = 'mainnet';

    window.SRNetwork = {
        current: CURRENT_NETWORK,
        config: NETWORK_CONFIG[CURRENT_NETWORK],
        all: NETWORK_CONFIG
    };
})();
