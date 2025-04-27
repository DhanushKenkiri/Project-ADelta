// Type definitions for stellar-sdk
// Project: Project-ADelta
// This is a minimal TypeScript declaration file for stellar-sdk
// to ensure compatibility with our mocked implementation

declare module 'stellar-sdk' {
  // Basic types
  export class Keypair {
    static random(): Keypair;
    static fromPublicKey(publicKey: string): Keypair;
    static fromSecret(secretKey: string): Keypair;
    publicKey(): string;
    secret(): string;
    sign(data: Buffer): Buffer;
    verify(data: Buffer, signature: Buffer): boolean;
  }

  // Network constants
  export const Networks: {
    PUBLIC: string;
    TESTNET: string;
  };

  // Basic constants
  export const BASE_FEE: string;

  // Mocked Server class that will be replaced by our implementation
  export class Server {
    constructor(serverURL: string);
    loadAccount(publicKey: string): Promise<any>;
    submitTransaction(transaction: any): Promise<any>;
    transactions(): any;
  }

  // Operation namespace
  export const Operation: {
    payment(options: any): any;
    changeTrust(options: any): any;
  };

  // Asset class
  export class Asset {
    constructor(code: string, issuer: string);
    static native(): Asset;
  }

  // Transaction builder
  export class TransactionBuilder {
    constructor(account: any, options: any);
    addOperation(operation: any): TransactionBuilder;
    addMemo(memo: any): TransactionBuilder;
    setTimeout(timeout: number): TransactionBuilder;
    build(): any;
  }

  // Memo types
  export const Memo: {
    text(text: string): any;
    none(): any;
  };
} 