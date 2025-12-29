import React from 'react'
import { FaShoppingCart, FaUser, FaUserCircle } from 'react-icons/fa'
import { FaArrowAltCircleLeft } from "react-icons/fa"
import logo from '../assets/logo.png'
import Search from './Search'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useMobile from '../hooks/useMobile'
import { useSelector } from 'react-redux'


const Header = () => {
  const [isMobile] = useMobile()   // ✅ SAME AS FIRST CODE
  const location = useLocation()
  const navigate = useNavigate()
  const user = useSelector((state)=>state?.user)

  const isSearchPage = location.pathname === '/search'

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">

      {/* ✅ SEARCH PAGE + MOBILE HEADER */}
      {(isSearchPage && isMobile) && (
        <div className="h-20 max-w-7xl mx-auto px-4 flex items-center gap-3">

          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="text-gray-700"
          >
            <FaArrowAltCircleLeft size={24} />
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img
              src={logo}
              width={120}
              height={60}
              alt="logo"
            />
          </Link>

          {/* Search */}
          <div className="flex-1">
            <Search />
          </div>

          {/* User Icon */}
          <button className="text-gray-700">
            <FaUserCircle size={26} />
          </button>
        </div>
      )}

      {/* ✅ NORMAL HEADER (ALL OTHER CASES) */}
      {!(isSearchPage && isMobile) && (
        <>
          <div className="h-20 max-w-7xl mx-auto px-4 flex items-center justify-between">

            {/* Logo */}
            <Link to="/" className="flex items-center">
              <img
                src={logo}
                width={170}
                height={60}
                alt="logo"
                className="hidden lg:block"
              />
              <img
                src={logo}
                width={120}
                height={60}
                alt="logo"
                className="lg:hidden"
              />
            </Link>

            {/* Search Desktop */}
            <div className="hidden lg:block w-1/2">
              <Search />
            </div>

            {/* User & Cart */}
            <div className="flex items-center gap-5">

              <Link to={'/login'} className="hidden lg:block text-gray-700">
                Login
              </Link>

              <button className="hidden lg:block relative text-gray-700">
                <FaShoppingCart size={20} />
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  10
                </span>
              </button>

              {/* Mobile User */}
              <button className="lg:hidden text-gray-700">
                <FaUserCircle size={25} />
              </button>
            </div>
          </div>

          {/* Search Mobile */}
          <div className="px-2 lg:hidden">
            <Search />
          </div>
        </>
      )}
    </header>
  )
}

export default Header
