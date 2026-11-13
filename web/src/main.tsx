import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import '@shared/styles/fonts.css'
import '@shared/styles/brand.css'
import '@shared/styles/proximity.css'
import '@shared/styles/info-chips.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)