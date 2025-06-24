import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeTheme, waitForThemeColors, debugThemeColors } from './utils/themeColors';
import './theme-colors.css';

// Initialize theme system and wait for CSS to load
async function startApp() {
  const initialTheme = initializeTheme();
  console.log(`Application starting with ${initialTheme} theme`);
  
  // Wait for theme colors to be available
  const colorsLoaded = await waitForThemeColors();
  
  if (colorsLoaded) {
    console.log('Theme colors loaded successfully');
  } else {
    console.warn('Theme colors may not be fully loaded');
  }
  
  // Debug theme colors in development
  if (import.meta.env.DEV) {
    debugThemeColors();
  }
  
  // Render the app
  createRoot(document.getElementById('root')!).render(
    <App />
  );
}

// Start the application
startApp().catch(console.error);
