import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Register from './Register.jsx'
import Attendance from './Attendance.jsx'
import Survey from './Survey.jsx'

const path = window.location.pathname
const root = ReactDOM.createRoot(document.getElementById('root'))

if (path === '/register') {
  root.render(<Register />)
} else if (path.startsWith('/attendance/')) {
  root.render(<Attendance />)
} else if (path.startsWith('/survey/')) {
  root.render(<Survey />)
} else {
  root.render(<App />)
}
