import React, { useState } from 'react'
import { FaEyeSlash } from "react-icons/fa";
import { FaEye } from "react-icons/fa";
import toast, { Toaster } from 'react-hot-toast';
// import axios from 'axios'
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import { useNavigate } from 'react-router-dom';

export const RegisterPage = () => {
  const navigate = useNavigate()
  const [data,setData] = useState(
    {
      name:'',
      email:'',
      password:'',
      confirmPassword:''
    }
  )
  const handleChange =(e)=>{
    const {name ,value} = e.target
    setData((prevValue)=>{
      return{
        ...prevValue,
        [name]:value
      }
    })
  }
  const [showPassword,setShowPassword] = useState(false)
  const [showconfirmPassword,setConfirmPassword] = useState(false)

 const handleSubmit = async (e) =>{
  e.preventDefault()
  if(data.password !== data.confirmPassword){
    toast.error(
      "Password And Confirm Password must be same"
    )
    return
  }
 try{
   const response = await Axios({
  ...SummaryApi.register,
  data: {
    name: data.name,
    email: data.email,
    password: data.password
  }
})
if(response.data.error){
  toast.error(response.data.message)
}
if(response.data.success){
  toast.success(response.data.message)
  navigate('/login')
}

  console.log('response',response)
 }catch(error){
  AxiosToastError(error)
 }
 }
  return (
    <section className='bg-amber-300 w-100'>
        <div className='rounded w-50 mx-auto'> 
          <h1>Welcome Regiter Page</h1>
          <form onSubmit={handleSubmit}>
            {/* name */}
            <div>
              <label htmlFor='name'>Name</label>
              <input
              id='name' 
                type='text'
                autoFocus
                className='bg-amber-50'
                value={data.name}
                name='name'
                onChange={handleChange}
              />
            </div>
            {/* email */}
            <div>
              <label htmlFor='email'>Email</label>
              <input
              id='email' 
                type='email'
          
                className='bg-amber-50'
                value={data.email}
                name='email'
                onChange={handleChange}
              />
            </div>
            {/* password */}
            <div>
              <label htmlFor='password'>password</label>
              {/* pass Eye Symbole */}
              <div>
                <input
              id='password' 
                type={showPassword ? 'text' :'password'}
                
                className='bg-amber-50'
                value={data.password}
                name='password'
                onChange={handleChange}
              />
              </div>
              <div onClick={()=> setShowPassword(prevValue=>!prevValue)}>
                {/* eye */}
                {
                  showPassword ? ( <FaEye />) : ( <FaEyeSlash />)
                }
              </div>
            </div>
            {/* confirm password */}
            <div>
              <label htmlFor='confirmPassword'>Confirm Password</label>
              {/* pass Eye Symbole */}
              <div>
                <input
              id='confirmPassword' 
                type={showconfirmPassword ? 'text' :'password'}
                
                className='bg-amber-50'
                value={data.confirmPassword}
                name='confirmPassword'
                onChange={handleChange}
              />
              </div>
              <div onClick={()=> setConfirmPassword(prevValue=>!prevValue)}>
                {/* eye */}
                {
                  showconfirmPassword ? ( <FaEye />) : ( <FaEyeSlash />)
                }
              </div>
            </div>
            {/* register Button */}
            <button className='bg-green-300 text-white py-2 rounded w-30'>register</button>
          </form>
        </div>
    </section>
  )
}
export default RegisterPage
