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
      <Toaster />
    </>
  )
}

export default App
