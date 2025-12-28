import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { splitVendorChunkPlugin } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // Configure react plugin for better compatibility
    react({
      jsxRuntime: 'classic', // Ensures React is available
    }), 
    splitVendorChunkPlugin()
  ],
  
  // Server configuration
  server: {
    port: 3000,
    proxy: {
      '/api/v1': {
        target: 'https://api.holidayvibestour.com',
        changeOrigin: true,
        secure: false,  
      }
    }
  },
  
  build: {
    // Enable sourcemaps in development, disable in production
    sourcemap: process.env.NODE_ENV !== 'production',
    
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split vendor libraries into separate chunks
          if (id.includes('node_modules')) {
            // ============ CRITICAL FIX ============
            // React and ReactDOM MUST be together
            if (
              id.includes('/react/') || 
              id.includes('/react-dom/') ||
              id.includes('react') && !id.includes('react-aria') // Exclude other react packages
            ) {
              console.log('📦 Bundling React in react-vendor:', id.split('/').pop());
              return 'react-vendor'; // Keep React and ReactDOM together
            }
            // UI libraries
            if (id.includes('@headlessui/react') || id.includes('@heroicons/react')) {
              return 'ui-vendor'
            }
            // PDF generation
            if (id.includes('jspdf') || id.includes('html2canvas')) {
              return 'pdf-vendor'
            }
            // Charts
            if (id.includes('recharts') || id.includes('chart.js')) {
              return 'chart-vendor'
            }
            // Maps
            if (id.includes('leaflet')) {
              return 'map-vendor'
            }
            // Forms
            if (id.includes('react-hook-form') || id.includes('yup')) {
              return 'form-vendor'
            }
            // Default vendor chunk for other dependencies
            return 'vendor'
          }
        },
        // Ensure consistent naming
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    
    // CHANGE HERE: Use esbuild instead of terser
    minify: 'esbuild',
    
    // Optional esbuild configuration
    esbuild: {
      drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
      pure: process.env.NODE_ENV === 'production' ? ['console.log', 'console.debug'] : [],
    },
    
    // Better chunk splitting
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      'jspdf',
      'html2canvas',
    ],
    // Ensure React is not excluded
    exclude: [],
  },
  
  // Define global constants
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    '__VUE_OPTIONS_API__': true,
    '__VUE_PROD_DEVTOOLS__': false,
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      // Add any aliases if needed
    },
  },
})