const { StxContractClient, DEFAULT_NETWORK } = require('@earnwithalee/stx-contract');

async function main() {
  console.log('🚀 Initializing StxContractClient...');
  
  try {
    const client = new StxContractClient({ network: 'mainnet' });
    console.log('✅ Client initialized successfully on network:', client.network || DEFAULT_NETWORK);
    console.log('ℹ️ Client Instance:', Object.keys(client));
    
    // We can simulate fetching data or preparing a contract call here
    console.log('✅ Successfully integrated @earnwithalee/stx-contract into backend tools!');
  } catch (error) {
    console.error('❌ Error initializing @earnwithalee/stx-contract:', error.message);
  }
}

main();
