import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { MusicProvider, MusicToggleButton } from './components/MusicController'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MusicProvider>
      <App />
      <MusicToggleButton />
    </MusicProvider>
  </StrictMode>,
)

