import { createRoot } from 'react-dom/client'
import './index.css'
// @ts-expect-error App.jsx is not typed
import App from './App.jsx'

createRoot(document.getElementById('root')!).render(
  
    <App />
  
)