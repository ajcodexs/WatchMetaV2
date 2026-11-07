import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { TooltipProvider } from './components/ui/tooltip'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { LibraryProvider } from './context/LibraryContext.jsx'
import { Toaster } from 'sonner'
import App from './App.jsx'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <TooltipProvider>
          <ThemeProvider>
            <LibraryProvider>
              <App />
              <Toaster richColors />
            </LibraryProvider>
          </ThemeProvider>
        </TooltipProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
)
