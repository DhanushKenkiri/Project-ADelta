// Script to deploy the MailShare contract to various Ethereum L2 networks
require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Compile the contract first using command line tools (solc)
// e.g., solc --abi --bin contracts/MailShare.sol -o build/

// Load ABI and bytecode
const contractPath = path.join(__dirname, '../build/MailShare.json');
const contractData = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

// L2 network configurations
const networks = {
  optimism: {
    rpc: process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
    chainId: 10,
    name: 'Optimism Mainnet'
  },
  arbitrum: {
    rpc: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    chainId: 42161,
    name: 'Arbitrum One'
  },
  polygon: {
    rpc: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
    chainId: 137,
    name: 'Polygon Mainnet'
  },
  // For testing
  goerli: {
    rpc: process.env.GOERLI_RPC_URL || 'https://goerli.infura.io/v3/your-infura-key',
    chainId: 5,
    name: 'Goerli Testnet'
  }
};

async function deployContract(network) {
  try {
    console.log(`Deploying MailShare contract to ${network.name}...`);
    
    // Connect to the network
    const provider = new ethers.JsonRpcProvider(network.rpc);
    
    // Connect wallet with private key
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    console.log(`Connected with wallet: ${wallet.address}`);
    
    // Create contract factory
    const factory = new ethers.ContractFactory(
      contractData.abi,
      contractData.bytecode,
      wallet
    );
    
    // Deploy the contract
    const contract = await factory.deploy();
    await contract.waitForDeployment();
    
    const contractAddress = await contract.getAddress();
    console.log(`Contract deployed to: ${contractAddress} on ${network.name}`);
    
    // Save deployment info
    const deploymentInfo = {
      network: network.name,
      chainId: network.chainId,
      address: contractAddress,
      deployer: wallet.address,
      txHash: contract.deploymentTransaction().hash,
      timestamp: new Date().toISOString()
    };
    
    // Save to deployments file
    const deploymentsPath = path.join(__dirname, '../deployments.json');
    let deployments = {};
    
    if (fs.existsSync(deploymentsPath)) {
      deployments = JSON.parse(fs.readFileSync(deploymentsPath, 'utf8'));
    }
    
    deployments[network.name] = deploymentInfo;
    fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));
    
    return deploymentInfo;
  } catch (error) {
    console.error(`Error deploying to ${network.name}:`, error);
    throw error;
  }
}

async function main() {
  const targetNetwork = process.argv[2];
  
  if (!targetNetwork || !networks[targetNetwork]) {
    console.error(`Please specify a valid network: ${Object.keys(networks).join(', ')}`);
    process.exit(1);
  }
  
  try {
    const deploymentInfo = await deployContract(networks[targetNetwork]);
    console.log(`Deployment successful on ${deploymentInfo.network}`);
    console.log(deploymentInfo);
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

// Run deployment
if (require.main === module) {
  main();
}

module.exports = {
  deployContract,
  networks
}; 