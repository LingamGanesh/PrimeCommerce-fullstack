import React, { useEffect, useState } from 'react'
import { FaSearch } from 'react-icons/fa'
import { useLocation, useNavigate } from 'react-router-dom'

const Search = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const [searchPage, setIsSearchPage] = useState(false)

  useEffect(() => {
    setIsSearchPage(location.pathname === '/search')
  }, [location.pathname])

  const redirectToSearchPage = () => {
    if (!searchPage) {
      navigate('/search')
    }
  }

  return (
    <div className="w-full md:w-96 px-4 md:px-0">
      <div
        className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2 w-full cursor-pointer"
        onClick={redirectToSearchPage}
      >
        <FaSearch className="text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Search products..."
          readOnly
          className="bg-transparent outline-none w-full text-gray-700 dark:text-gray-200 placeholder-gray-400 cursor-pointer"
        />
      </div>
    </div>
  )
}

export default Search
