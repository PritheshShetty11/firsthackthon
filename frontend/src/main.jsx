import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Custom loading indicator
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-custom">
    <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
  </div>
)

const container = document.getElementById('root')
const root = createRoot(container)

// Add a loading state while the app initializes
root.render(
  <React.StrictMode>
    <React.Suspense fallback={<LoadingSpinner />}>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50 transition-colors duration-300">
          <App />
        </div>
      </BrowserRouter>
    </React.Suspense>
  </React.StrictMode>
)