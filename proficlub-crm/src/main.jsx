import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Register from './Register.jsx'

const path = window.location.pathname
const root = ReactDOM.createRoot(document.getElementById('root'))

if (path === '/register') {
  root.render(<Register />)
} else {
  root.render(<App />)
}
