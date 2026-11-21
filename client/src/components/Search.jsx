import { useState } from "react";
import { IoSearch } from "react-icons/io5";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

export default function Search() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");

  const submitSearch = (event) => {
    event.preventDefault();
    const value = query.trim();
    navigate(value ? `/search?q=${encodeURIComponent(value)}` : "/search");
  };

  return (
    <form onSubmit={submitSearch} className="flex h-11 w-full min-w-0 items-center overflow-hidden rounded-lg border bg-slate-50 text-neutral-500 transition focus-within:border-amber-300 lg:h-12" role="search">
      <button type="submit" aria-label="Search products" className="flex h-full items-center justify-center p-3 hover:text-green-700"><IoSearch size={22} /></button>
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => { if (location.pathname !== "/search") navigate("/search"); }}
        placeholder='Search "milk", bread, fruits…'
        aria-label="Search products"
        className="h-full min-w-0 w-full bg-transparent pr-3 text-sm text-gray-800 outline-none placeholder:text-gray-400"
      />
    </form>
  );
}
