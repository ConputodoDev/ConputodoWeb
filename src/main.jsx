import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import ErrorBoundary from './components/ui/ErrorBoundary'; // <--- Importar

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary> {/* <--- Envolver */}
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)