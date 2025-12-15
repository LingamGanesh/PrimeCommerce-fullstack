import React from 'react'
import {  FaShoppingCart, FaUser } from 'react-icons/fa'
import logo from '../assets/logo.png'
import Search from './Search'
import { Link } from 'react-router-dom'


const Header = () => {
  return (
    <header className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50 transition-colors duration-300">
      
      {/* Top Row */}
      <div className="h-20 max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">

        {/* Logo */}
       <Link to='/'>
         <img
          src={logo}
          alt="Logo"
          className="h-8 md:h-10 w-auto"
        />
       </Link>

            <div className=" mx-4">
        <Search/>
        </div>

        {/* Login & Cart */}
        <div className="flex items-center space-x-5">
          <button className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
            <FaUser size={18} />
          </button>

          <button className="relative text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
            <FaShoppingCart size={20} />
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
              2
            </span>
          </button>
        </div>
      </div>

    
    </header>
  )
}

export default Header
