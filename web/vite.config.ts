import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'


export default defineConfig({
  plugins: [          // Plugins Vite
    react({
      babel: {
        plugins: [    // Plugins Babel, passés au plugin React
          ['@babel/plugin-proposal-decorators', { legacy: true },],
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@api': resolve(__dirname, 'src/api'),
      '@components': resolve(__dirname, 'src/components'),
      // '@fonts': resolve(__dirname, 'src/fonts'),
      // '@locales': resolve(__dirname, 'src/locales'),
      '@screens': resolve(__dirname, 'src/screens'),
      '@store': resolve(__dirname, 'src/store'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@types': resolve(__dirname, 'src/types'),
      // '@assets': resolve(__dirname, 'src/assets'),
      // '@utils': resolve(__dirname, 'src/utils'),
    }
  },
  server: {
    port: 3000,
    host: true
  }
})