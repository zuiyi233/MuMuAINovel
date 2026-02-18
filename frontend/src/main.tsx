import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'antd/dist/reset.css';
import './design-system/generated/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/accessibility.css';
import './styles/utilities.css';
import './index.css';
import App from './App.tsx';
import { ThemeProvider } from './theme-plugins/ThemeProvider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
