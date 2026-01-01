import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Add Cashfree SDK script to the document
const cashfreeScript = document.createElement('script');
cashfreeScript.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
cashfreeScript.async = true;
document.head.appendChild(cashfreeScript);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)