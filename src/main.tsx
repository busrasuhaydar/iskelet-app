import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Handle and suppress Vite development WebSocket connection errors in sandbox/preview
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason?.message || event.reason?.toString?.() || '';
  if (reason.includes('WebSocket') || reason.includes('closed without opened')) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(<App />);

