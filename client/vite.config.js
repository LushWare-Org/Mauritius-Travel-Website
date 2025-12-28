import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { splitVendorChunkPlugin } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), splitVendorChunkPlugin()],
  
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
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split vendor libraries into separate chunks
          if (id.includes('node_modules')) {
            // React and related
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'react-vendor'
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
        }
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
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
    exclude: [],
  },
})