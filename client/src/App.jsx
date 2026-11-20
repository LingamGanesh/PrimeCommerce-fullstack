import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import './App.css'
import Header from './components/Header'
import Footer from './components/Footer'
import fetchUserDetails from './utils/fetchUserDetails'
import { setUserDetails } from './store/UserSlice.js'

function App() {
  const dispatch = useDispatch()
  const location = useLocation()
  const isStaffRoute = ['/admin', '/picker', '/rider'].some((path) =>
    location.pathname.startsWith(path)
  )

  useEffect(() => {
    let mounted = true

    fetchUserDetails().then((userData) => {
      if (mounted && userData?.data) {
        dispatch(setUserDetails(userData.data))
      }
    })

    return () => {
      mounted = false
    }
  }, [dispatch])

  return (
    <>
      {!isStaffRoute && <Header />}
      <main className="min-h-[60vh]">
        <Outlet />
      </main>
      {!isStaffRoute && <Footer />}
      <Toaster />
    </>
  )
}

export default App
