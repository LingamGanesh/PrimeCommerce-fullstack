
import { Outlet } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import Header from './components/Header'
import Footer from './components/Footer'
import toast, { Toaster } from 'react-hot-toast';
import fetchUserDetails from './utils/fetchUserDetails'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { setUserDetails } from './store/userSlice'
import { useDispatch } from 'react-redux'

function App() {
 const dispatch = useDispatch()
 const location = useLocation()
 const isAdminRoute = location.pathname.startsWith('/admin')
  const fetchUserData = async() =>{
    const userData = await fetchUserDetails()

    dispatch(setUserDetails(userData.data))
  }

  useEffect(()=>{
    fetchUserData()
  },[])

  return (
  <>
  {!isAdminRoute && <Header/>}
   <main className='min-h-[60vh]'>
      <Outlet />
   </main>
   {!isAdminRoute && <Footer/>}
    <Toaster />
  </>
  )
}

export default App
