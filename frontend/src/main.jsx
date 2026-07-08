import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Theme init
const savedTheme = localStorage.getItem('wellness_theme');
const theme = savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'dark';
document.documentElement.dataset.theme = theme;

createRoot(document.getElementById('root')).render(

  <StrictMode>
    <App />
  </StrictMode>,
)
