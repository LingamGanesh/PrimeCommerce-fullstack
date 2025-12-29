
import { Outlet } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import Header from './components/Header'
import Footer from './components/Footer'
import toast, { Toaster } from 'react-hot-toast';
import fetchUserDetails from './utils/fetchUserDetails'
import { useEffect } from 'react'
import { setUserDetails } from './store/userSlice'
import { useDispatch } from 'react-redux'

function App() {
 const dispatch = useDispatch()
  const fetchUserData = async() =>{
    const userData = await fetchUserDetails() 
    dispatch(setUserDetails(userData.data))
  }

  useEffect(()=>{
    fetchUserData()
  },[])

  return (
  <>
  <Header/>
   <main className='min-h-[60vh]'>
      <Outlet />
   </main>
   <Footer/>
    <Toaster />
  </>
  )
}

export default App
