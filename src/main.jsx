import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { MusicProvider, MusicToggleButton } from './components/MusicController'
import LoadingScreen from './components/LoadingScreen'

function Root() {
  const [isLoaded, setIsLoaded] = useState(false);

  // Fallback: force show after 10 seconds in case loading fails
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isLoaded) {
        console.warn('Loading timeout, forcing app to show');
        setIsLoaded(true);
      }
    }, 10000);
    return () => clearTimeout(timeout);
  }, [isLoaded]);

  return (
    <StrictMode>
      <MusicProvider>
        <div className="min-h-screen bg-slate-950">
          {!isLoaded && <LoadingScreen onComplete={() => setIsLoaded(true)} />}
          <div style={{ display: isLoaded ? 'block' : 'none' }}>
            <App />
            <MusicToggleButton />
          </div>
        </div>
      </MusicProvider>
    </StrictMode>
  );
}

createRoot(document.getElementById('root')).render(<Root />)

