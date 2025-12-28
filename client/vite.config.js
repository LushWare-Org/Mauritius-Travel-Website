import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'classic',
    }),
  ],
  
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
        secure: false,
      },
    },
  },
  
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    
    esbuild: {
      drop: ['console', 'debugger'],
    },
    
    rollupOptions: {
      output: {
        // Smart manual chunking - prevents React errors while optimizing
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Group React packages together (CRITICAL to prevent undefined errors)
            if (id.includes('/react/') || id.includes('/react-dom/')) {
              return 'vendor-react';
            }
            
            // Group jsPDF and html2canvas together
            if (id.includes('jspdf') || id.includes('html2canvas')) {
              return 'vendor-pdf';
            }
            
            // Group UI libraries
            if (id.includes('lucide-react') || id.includes('recharts')) {
              return 'vendor-ui';
            }
            
            // Group routing/state management
            if (id.includes('react-router') || id.includes('react-hook-form')) {
              return 'vendor-routing';
            }
            
            // Everything else
            return 'vendor';
          }
          // IMPORTANT:  return undefined for app code
          // This lets Vite handle your src/ files automatically
          return undefined;
        },
        
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    
    // Increase warning limit
    chunkSizeWarningLimit: 2000,
    
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    
    target: 'es2020',
    
    // Enable brotli compression for better gzip
    reportCompressedSize: true,
  },
  
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'lucide-react',
      'jspdf',
      'html2canvas',
      'react-datepicker',
      'framer-motion',
      'react-icons',
      'yup',
      'formik',
      '@heroicons/react',
    ],
    exclude: [],
  },
  
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },
  
  css: {
    devSourcemap: false,
  },
});