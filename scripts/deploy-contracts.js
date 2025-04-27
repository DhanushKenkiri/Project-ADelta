/**
 * Script to deploy mail sharing contracts to Ethereum L2 networks
 * 
 * Usage:
 * node scripts/deploy-contracts.js <network>
 * 
 * Example:
 * node scripts/deploy-contracts.js optimism
 * node scripts/deploy-contracts.js arbitrum
 * node scripts/deploy-contracts.js polygon
 * node scripts/deploy-contracts.js goerli
 */

// Import the deployment script
const { deployContract, networks } = require('../contracts/deploy');

async function main() {
  console.log('Starting contract deployment');
  
  const targetNetwork = process.argv[2];
  
  if (!targetNetwork || !networks[targetNetwork]) {
    console.error(`Please specify a valid network: ${Object.keys(networks).join(', ')}`);
    process.exit(1);
  }
  
  try {
    console.log(`Deploying to ${targetNetwork}...`);
    const deploymentInfo = await deployContract(networks[targetNetwork]);
    
    console.log('=============================================');
    console.log(`Deployment successful on ${deploymentInfo.network}`);
    console.log('Contract address:', deploymentInfo.address);
    console.log('Transaction hash:', deploymentInfo.txHash);
    console.log('Deployer address:', deploymentInfo.deployer);
    console.log('=============================================');
    
    console.log('Add this address to your .env file:');
    console.log(`${targetNetwork.toUpperCase()}_CONTRACT_ADDRESS=${deploymentInfo.address}`);
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

// Run deployment
if (require.main === module) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
} 