import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import ShopContextProvider from './context/ShopContext.jsx'
import { NotificationProvider } from './context/NotificationContext.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>

    <NotificationProvider>
      <ShopContextProvider>
        <App />
      </ShopContextProvider>
    </NotificationProvider>

  </BrowserRouter>,
)
