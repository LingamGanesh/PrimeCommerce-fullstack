import { useState } from "react";
import { TypeAnimation } from "react-type-animation";
import { IoSearch } from "react-icons/io5";
import { FiArrowUpRight, FiX } from "react-icons/fi";
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

  const openSearch = () => navigate(query.trim() ? "/search?q=" + encodeURIComponent(query.trim()) : "/search");

  return (
    <form
      onSubmit={submitSearch}
      role="search"
      className="group relative flex h-12 w-full min-w-0 items-center rounded-2xl border border-[#e5e9df] bg-[#f7f9f4] px-1.5 shadow-[inset_0_1px_2px_rgba(25,45,28,.025)] transition-all duration-200 hover:border-[#cbd9c8] hover:bg-white focus-within:border-[#4b8b5c] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(75,139,92,.10)] lg:h-[50px]"
    >
      <span className="ml-2.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl text-[#47734f] transition-colors group-focus-within:bg-[#eaf2e8]">
        <IoSearch size={21} aria-hidden="true" />
      </span>

      {isSearchPage ? (
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search milk, fresh fruits, snacks..."
          aria-label="Search products"
          autoFocus
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-[13px] font-medium text-[#24372a] outline-none placeholder:font-normal placeholder:text-[#929b91] sm:text-sm"
        />
      ) : (
        <button
          type="button"
          onClick={openSearch}
          className="h-full min-w-0 flex-1 px-3 text-left text-[13px] font-medium text-[#7b877b] sm:text-sm"
          aria-label="Open product search"
        >
          <span className="mr-1 text-[#a1a99e]">Find</span>
          <TypeAnimation
            sequence={[
              'fresh fruits', 1400,
              'daily essentials', 1400,
              'milk & dairy', 1400,
              'snacks you love', 1400,
              'your favourites', 1400,
            ]}
            wrapper="span"
            speed={45}
            repeat={Infinity}
            className="font-semibold text-[#526b55]"
          />
        </button>
      )}

      {isSearchPage && query && (
        <button
          type="button"
          onClick={() => setQuery("")}
          aria-label="Clear search"
          className="mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#89948a] transition hover:bg-[#edf2eb] hover:text-[#294b31]"
        >
          <FiX size={16} />
        </button>
      )}

      <button
        type={isSearchPage ? "submit" : "button"}
        onClick={isSearchPage ? undefined : openSearch}
        aria-label="Search"
        className="mr-0.5 flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#1e6338] px-3.5 text-xs font-extrabold text-white shadow-[0_3px_8px_rgba(30,99,56,.16)] transition hover:-translate-y-px hover:bg-[#174e2d] active:translate-y-0 sm:px-4"
      >
        <span className="hidden sm:inline">Search</span>
        <FiArrowUpRight size={15} />
      </button>
    </form>
  );
}
