import { defineConfig, loadEnv, Plugin } from "vite";
import type { ConfigEnv, UserConfig } from 'vite';
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// Custom plugin to alias node: imports
function nodeModuleAliasPlugin(): Plugin {
  return {
    name: 'node-module-alias',
    resolveId(id) {
      // Handle specific node: imports that need custom polyfills
      if (id === 'node:fs' || id === 'fs') {
        return path.resolve(__dirname, 'src/polyfills/fs.js');
      }
      if (id === 'node:net' || id === 'net') {
        return path.resolve(__dirname, 'src/polyfills/net.js');
      }
      return null;
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }: ConfigEnv): UserConfig => {
  // Load environment variables based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    base: './',
    server: {
      host: "::",
      port: 5175,
      // Show less severe errors in browser overlay
      hmr: {
        overlay: true,
      },
      proxy: {
        // Proxy API requests to our own API server
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          }
        }
      }
    },
    plugins: [
      react(),
      nodeModuleAliasPlugin(),
      nodePolyfills({
        // Include all Node.js polyfills needed for your project
        include: ['path', 'stream', 'util', 'events', 'buffer'],
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "node:fs": path.resolve(__dirname, "./src/polyfills/fs.js"),
        "node:net": path.resolve(__dirname, "./src/polyfills/net.js"),
      },
    },
    // Define environment variable defaults
    define: {
      __APP_ENV__: JSON.stringify(mode),
      // Add global variables for the browser environment
      'process.env': JSON.stringify(process.env),
      global: 'globalThis',
    },
    optimizeDeps: {
      esbuildOptions: {
        define: {
          global: 'globalThis'
        }
      },
      // Force include these dependencies to ensure proper polyfill
      include: [
        'react', 
        'react-dom', 
        'react-router-dom',
        'next-themes',
        'sonner',
        'clsx',
        'tailwind-merge',
        'groq-sdk',
        '@radix-ui/react-tooltip'
      ]
    },
    build: {
      sourcemap: mode !== 'production',
      reportCompressedSize: true,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
        },
      },
    },
    publicDir: 'public',
  };
});
