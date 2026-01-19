import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  
  server: {
    port: 3000,
    proxy: {
      '/api/v1': {
        target: 'https://api.holidayvibestour.com',
        changeOrigin: true,
        
        // rewrite: (path) => path.replace(/^\/api\/v1/, '/api/v1')
      },
    },
  },
  
  // ADD THIS BUILD CONFIGURATION
  build: {
    outDir: 'dist',
    sourcemap: false, 
    minify: 'esbuild', 
    
    //Remove console logs in production
    esbuild: {
      drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    },
    
    // Let Vite handle chunking automatically (prevents circular dependency errors)
    rollupOptions: {
      output: {
        manualChunks: undefined,
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    
    chunkSizeWarningLimit: 1800, 
  },
  
  optimizeDeps: {
    include: [
      'axios',
      'react',       
      'react-dom',   
      'react-router-dom', 
    ],
  },
});