import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeTheme } from './utils/themeColors';
import './theme-colors.css';

// Initialize theme system before rendering
const initialTheme = initializeTheme();
console.log(`Application starting with ${initialTheme} theme`);

createRoot(document.getElementById('root')!).render(
  <App />
);
