
import { Outlet } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import Header from './components/Header'
import Footer from './components/Footer'
import toast, { Toaster } from 'react-hot-toast';

function App() {
 

  return (
  <>
  <Header/>
   <main className='min-h-[50vh]'>
      <Outlet />
   </main>
   <Footer/>
    <Toaster />
  </>
  )
}

export default App
