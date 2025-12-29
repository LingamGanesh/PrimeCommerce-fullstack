import React, { useEffect, useState } from 'react'
import { TypeAnimation } from 'react-type-animation';
import { IoSearch } from "react-icons/io5";
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Search = () => {
    const [isSearchPage , setIsSearch] = useState()

    const navigate = useNavigate()

    const location = useLocation()
    

     useEffect(()=>{
        const path =location.pathname === '/search' 
        setIsSearch(path)
    },[location])
    
    const reDirectiToSearch = ()=>
    {
        navigate('/search')
    }
  return (
    <div className='w-full  min-w-[300px] lg:min-w-[420px] h-11 lg:h-12 rounded-lg border overflow-hidden flex items-center text-neutral-500 bg-slate-50 group focus-within:border-amber-300 '>
        <button className='flex justify-center items-center h-full p-3 group-focus-within:text-amber-300'>
                        <IoSearch size={22}/>
                    </button>
        <div className='w-full h-full'>
             <div  onClick={reDirectiToSearch} className='w-full h-full flex items-center'>
               {
                !isSearchPage ? 
                (
                    // not in searchpage
                     <TypeAnimation
                                sequence={[
                                    // Same substring at the start will only be typed out once, initially
                                    'Search "milk"',
                                    1000, // wait 1s before replacing "Mice" with "Hamsters"
                                    'Search "bread"',
                                    1000,
                                    'Search "sugar"',
                                    1000,
                                    'Search "panner"',
                                    1000,
                                    'Search "chocolate"',
                                    1000,
                                    'Search "curd"',
                                    1000,
                                    'Search "rice"',
                                    1000,
                                    'Search "egg"',
                                    1000,
                                    'Search "chips"',
                                ]}
                                wrapper="span"
                                speed={50}
                                repeat={Infinity}
                            />
                ):
                (
                    // in search
                    <div className='w-full h-full'>
                        <input 
                        type='text'
                        placeholder='Search Ata Dal etc....'
                       className='bg-transparent w-full h-full outline-none'
                        autoFocus
                        />
                    </div>

                )
               }
             </div>
        </div>
    </div>
  )
}

export default Search