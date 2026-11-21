import { useState } from "react";
import { TypeAnimation } from "react-type-animation";
import { IoSearch } from "react-icons/io5";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

export default function Search() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") || "");
  const isSearchPage = location.pathname === "/search";

  const submitSearch = (event) => {
    event.preventDefault();
    const value = query.trim();
    navigate(value ? "/search?q=" + encodeURIComponent(value) : "/search");
  };

  return (
    <form onSubmit={submitSearch} className="group flex h-11 w-full min-w-0 items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-neutral-500 transition focus-within:border-lime-400 focus-within:bg-white lg:h-12 lg:min-w-[420px]">
      <button type="submit" aria-label="Search products" className="flex h-full items-center justify-center px-3 text-slate-500 transition group-focus-within:text-lime-700"><IoSearch size={22}/></button>
      {isSearchPage ? (
        <input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search milk, fruits, snacks…" aria-label="Search products" autoFocus className="h-full min-w-0 flex-1 bg-transparent pr-3 text-sm text-slate-800 outline-none"/>
      ) : (
        <button type="button" onClick={()=>navigate("/search")} className="h-full min-w-0 flex-1 text-left text-sm text-slate-500">
          <TypeAnimation sequence={['Search "milk"',1000,'Search "bread"',1000,'Search "sugar"',1000,'Search "paneer"',1000,'Search "chocolate"',1000,'Search "curd"',1000,'Search "rice"',1000,'Search "eggs"',1000,'Search "chips"',1000]} wrapper="span" speed={50} repeat={Infinity}/>
        </button>
      )}
    </form>
  );
}
