import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import EmployeePortal from './EmployeePortal.jsx'

const path = window.location.pathname

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {path.startsWith('/portal') ? <EmployeePortal /> : <App />}
  </React.StrictMode>
)
