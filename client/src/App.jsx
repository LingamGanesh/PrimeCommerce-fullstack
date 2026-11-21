import { Outlet, useLocation } from 'react-router-dom'
import './App.css'
import Header from './components/Header'
import Footer from './components/Footer'
import { Toaster } from 'react-hot-toast'
import fetchUserDetails from './utils/fetchUserDetails'
import { useEffect } from 'react'
import { setUserDetails } from './store/UserSlice'
import { useDispatch } from 'react-redux'

function App() {
  const dispatch = useDispatch()
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/picker') || location.pathname.startsWith('/rider')

  useEffect(() => {
    let isMounted = true

    const loadUserData = async () => {
      const userData = await fetchUserDetails()

      if (isMounted && userData?.data) {
        dispatch(setUserDetails(userData.data))
      }
    }

    loadUserData()

    return () => {
      isMounted = false
    }
  }, [dispatch])

  return (
    <>
      {!isAdminRoute && <Header />}
      <main className='min-h-[60vh]'>
        <Outlet />
      </main>
      {!isAdminRoute && <Footer />}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={10}
        toastOptions={{
          duration: 3600,
          className: 'pc-toast',
          style: { background: '#ffffff', color: '#172033' },
          success: { duration: 2800, className: 'pc-toast pc-toast-success', iconTheme: { primary: '#15803d', secondary: '#ecfdf5' } },
          error: { duration: 4500, className: 'pc-toast pc-toast-error', iconTheme: { primary: '#dc2626', secondary: '#fef2f2' } },
          loading: { className: 'pc-toast pc-toast-loading' },
        }}
      />
    </>
  )
}

export default App
