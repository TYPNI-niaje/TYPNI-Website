import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// import 'react-quill/dist/quill.snow.css' // Remove ReactQuill styles import
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { Toaster } from 'react-hot-toast'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
    <App />
      <Toaster position="top-right" />
    </AuthProvider>
  </StrictMode>,
)
