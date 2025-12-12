import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './composition.jsx'
import { AuthProvider, AppProvider } from './context'
import { ErrorBoundary } from './components'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)