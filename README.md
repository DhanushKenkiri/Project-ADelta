# Project ADelta

A collaborative template editor with enhanced Fluvio service for real-time collaboration.

## Features

- Real-time collaboration on HTML templates
- Browser-compatible Fluvio service with local fallback for collaboration
- User authentication with Firebase
- Template storage with Vercel Blob
- Rich template editing experience
- Feedback collection system
- ScreenPipe integration for enhanced screenshots
- AI-powered image analysis and Groq prompt generation
- Secure mail sharing through Ethereum L2 networks with web2 fallback

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm (v7 or later)
- Git
- ScreenPipe (for enhanced screenshots and image analysis)
- Groq API key (for AI features)
- Ethereum wallet (for L2 mail sharing)

### Installation

1. Clone the repository
   ```
   git clone https://github.com/dhanushkenkiri/Project-ADelta.git
   cd Project-ADelta
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Set up environment variables by copying `.env.example` to `.env` and filling in your credentials
   ```
   cp .env.example .env
   ```

4. Start the development server
   ```
   npm run dev
   ```

### Setting up ScreenPipe

For enhanced screenshot functionality and image analysis, you need to install ScreenPipe:

1. Download and install from [https://screenpi.pe/download](https://screenpi.pe/download)
2. Follow the setup instructions in [SCREENPIPE_SETUP.md](SCREENPIPE_SETUP.md)
3. See the image analysis documentation in [SCREENPIPE_INTEGRATION.md](SCREENPIPE_INTEGRATION.md)

### Setting up Ethereum L2 for Mail Sharing

The mail sharing functionality supports multiple Ethereum L2 networks:

1. Base
2. Optimism
3. Arbitrum
4. Polygon

To use this feature:

1. Add your wallet provider (MetaMask or similar) to your browser
2. Set up the following environment variables in your `.env` file:
   ```
   # Contract addresses on L2 networks
   OPTIMISM_CONTRACT_ADDRESS=your_optimism_contract_address
   ARBITRUM_CONTRACT_ADDRESS=your_arbitrum_contract_address
   POLYGON_CONTRACT_ADDRESS=your_polygon_contract_address
   
   # RPC URLs (optional - defaults provided)
   OPTIMISM_RPC_URL=https://mainnet.optimism.io
   ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
   POLYGON_RPC_URL=https://polygon-rpc.com
   
   # IPFS settings for content storage
   IPFS_PROJECT_ID=your_ipfs_project_id
   IPFS_PROJECT_SECRET=your_ipfs_project_secret
   ```

3. For development and testing purposes, web2 fallback is automatically used if wallet connection fails

## Deployment

The project can be deployed to Firebase Hosting:

1. Build the project
   ```
   npm run build
   ```

2. Deploy to Firebase
   ```
   firebase deploy
   ```

## Technology Stack

- React
- TypeScript
- Vite
- Firebase Authentication
- Vercel Blob Storage
- Fluvio for real-time collaboration
- ScreenPipe for enhanced screenshots
- Groq AI for intelligent template suggestions
- Ethereum L2 (Base, Optimism, Arbitrum, Polygon) for secure mail sharing
- IPFS for decentralized storage

## License

MIT
