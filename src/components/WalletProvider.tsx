import React, { useMemo } from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { clusterApiUrl } from '@solana/web3.js';

// Event emitter implementation
class EventEmitter {
  private listeners: Record<string, Function[]> = {};

  on(event: string, listener: Function): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  emit(event: string, ...args: any[]): void {
    const eventListeners = this.listeners[event];
    if (eventListeners) {
      eventListeners.forEach(listener => listener(...args));
    }
  }

  removeListener(event: string, listener: Function): void {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(l => l !== listener);
    }
  }
  
  // Alias for removeListener - required by Solana wallet adapter
  off(event: string, listener: Function): void {
    this.removeListener(event, listener);
  }
}

// Mock wallet adapter for demo purposes
class MockWalletAdapter extends EventEmitter {
  publicKey = {
    toString: () => 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr',
    toBase58: () => 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr',
    toBuffer: () => Buffer.from('Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr')
  };
  connected = true;
  connecting = false;
  readyState = 'Connected';
  ready = true;
  name = 'Mock Wallet';
  icon = 'data:image/svg+xml;base64,';
  supportedTransactionVersions = null;

  connect = async () => {
    this.connecting = true;
    this.emit('connect', this.publicKey);
    this.connecting = false;
  };

  disconnect = async () => {
    this.emit('disconnect');
  };

  sendTransaction = async () => { 
    return 'mock-transaction-signature';
  };

  signTransaction = async () => {
    return {} as any;
  };

  signAllTransactions = async () => {
    return [] as any[];
  };

  signMessage = async () => {
    return new Uint8Array();
  };
}

const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Set up network and endpoint
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // For demo purposes, we're using a mock wallet adapter
  // In a real app, you'd use real wallet adapters like this:
  // const wallets = useMemo(() => [
  //   new PhantomWalletAdapter(),
  //   new SolflareWalletAdapter(),
  // ], []);
  
  const wallets = useMemo(() => [new MockWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets as any} autoConnect>
        {children}
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};

export default WalletProvider; 