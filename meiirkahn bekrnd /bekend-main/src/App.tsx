import { useEffect, useState } from 'react'
import { useAuth } from './context/AuthContext'
import { LabSupplyFinder } from './components/LabSupplyFinder'
import { AdminDashboard } from './components/AdminDashboard'
import { AdminLogin } from './components/AdminLogin'
import { Login } from './components/Auth/Login'
import { Register } from './components/Auth/Register'
import { ForgotPassword } from './components/Auth/ForgotPassword'
import './App.css'

function App() {
  const { user, isAuthenticated } = useAuth()
  const [screen, setScreen] = useState<'login' | 'register' | 'forgot'>('login')
  const [path, setPath] = useState(window.location.pathname)

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = (url: string) => {
    window.history.pushState({}, '', url)
    setPath(url)
  }

  if (path === '/admin') {
    if (isAuthenticated && user?.role === 'admin') {
      return <AdminDashboard onClose={() => navigate('/')} />
    }
    return <AdminLogin onSwitchToUser={() => navigate('/')} />
  }

  if (isAuthenticated) {
    return <LabSupplyFinder />
  }

  return (
    <>
      {screen === 'login' && (
        <Login
          onSwitchToRegister={() => setScreen('register')}
          onSwitchToForgotPassword={() => setScreen('forgot')}
        />
      )}
      {screen === 'register' && <Register onSwitchToLogin={() => setScreen('login')} />}
      {screen === 'forgot' && <ForgotPassword onSwitchToLogin={() => setScreen('login')} />}
    </>
  )
}

export default App
