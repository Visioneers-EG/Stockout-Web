import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { MusicProvider, MusicToggleButton } from './components/MusicController'
import LoadingScreen from './components/LoadingScreen'

function Root() {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <StrictMode>
      <MusicProvider>
        {!isLoaded && <LoadingScreen onComplete={() => setIsLoaded(true)} />}
        <div style={{ visibility: isLoaded ? 'visible' : 'hidden' }}>
          <App />
          <MusicToggleButton />
        </div>
      </MusicProvider>
    </StrictMode>
  );
}

createRoot(document.getElementById('root')).render(<Root />)
