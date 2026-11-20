import { TypeAnimation } from 'react-type-animation';
import { IoSearch } from "react-icons/io5";
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Search = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const isSearchPage = location.pathname === '/search'

    const reDirectiToSearch = () => navigate('/search')

    return (
        <div className='w-full min-w-[300px] lg:min-w-[420px] h-11 lg:h-12 rounded-lg border overflow-hidden flex items-center text-neutral-500 bg-slate-50 group focus-within:border-amber-300'>
            <button type='button' onClick={reDirectiToSearch} aria-label='Open search' className='flex justify-center items-center h-full p-3 group-focus-within:text-amber-300'>
                <IoSearch size={22}/>
            </button>
            <div onClick={reDirectiToSearch} className='w-full h-full flex items-center'>
                {!isSearchPage
                    ? <TypeAnimation sequence={['Search "milk"',1000,'Search "bread"',1000,'Search "sugar"',1000,'Search "paneer"',1000,'Search "chocolate"',1000,'Search "curd"',1000,'Search "rice"',1000,'Search "egg"',1000,'Search "chips"']} wrapper="span" speed={50} repeat={Infinity}/>
                    : <Link to="/search" className="w-full px-2 text-sm text-slate-500">Search products…</Link>}
            </div>
        </div>
    )
}

export default Search