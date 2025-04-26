# Project ADelta

A collaborative template editor with enhanced Fluvio service for real-time collaboration.

## Features

- Real-time collaboration on HTML templates
- Browser-compatible Fluvio service with local fallback for collaboration
- User authentication with Firebase
- Template storage with Supabase
- Rich template editing experience
- Feedback collection system

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm (v7 or later)
- Git

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
- Supabase Storage
- Fluvio for real-time collaboration

## License

MIT
