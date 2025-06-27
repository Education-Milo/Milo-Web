import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [          // Plugins Vite
    react({
      babel: {
        plugins: [    // Plugins Babel, passés au plugin React
          ['@babel/plugin-proposal-decorators', { legacy: true }],
        ]
      }
    })
  ],
  server: {
    port: 3000,
    host: true
  }
})