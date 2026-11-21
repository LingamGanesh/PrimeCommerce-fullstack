import { useEffect, useState } from "react";
import { FaShoppingBasket, FaUserCircle, FaChevronDown, FaMapMarkerAlt } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Axios from "../utils/Axios";
import { Usermenu } from "./Usermenu";
import Search from "./Search";
import primeCommerceLogo from "../assets/prime-commerce-logo.svg";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const [openMenu, setOpenMenu] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    let active = true;
    if (!user?._id) return () => { active = false; };
    Axios.get("/api/v1/cart")
      .then((response) => {
        if (active) setCartCount(response.data?.data?.itemCount || 0);
      })
      .catch(() => {
        if (active) setCartCount(0);
      });
    return () => { active = false; };
  }, [user?._id, location.pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-[#eee9df] bg-white">
      <div className="mx-auto flex max-w-[1440px] items-center gap-4 px-4 py-3 sm:px-6 lg:gap-8 lg:px-8">
        <Link to="/" aria-label="Go to homepage" className="flex shrink-0 items-center">
          <img src={primeCommerceLogo} alt="Prime Commerce" className="h-10 w-auto max-w-[176px] object-contain sm:h-12 sm:max-w-[196px]" />
        </Link>

        <div className="hidden min-w-[150px] shrink-0 border-l border-gray-200 pl-5 md:block">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Delivering to</p>
          <button type="button" className="mt-1 flex items-center gap-1.5 text-left text-sm font-extrabold text-gray-900" onClick={() => navigate("/dashboard/address")}>
            <FaMapMarkerAlt className="text-[#16833b]" />
            <span>Add delivery address</span>
            <FaChevronDown className="text-[10px] text-gray-500" />
          </button>
        </div>

        <div className="hidden min-w-0 flex-1 md:block">
          <Search />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-5">
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu((value) => !value)}
              aria-expanded={openMenu}
              aria-label={user?._id ? "Open account menu" : "Login"}
              className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-gray-700 transition hover:bg-[#f7f7f2]"
            >
              <FaUserCircle className="text-xl text-gray-700 sm:text-2xl" />
              <span className="hidden lg:inline">{user?._id ? "Account" : "Login"}</span>
              <FaChevronDown className="hidden text-[10px] lg:inline" />
            </button>
            {openMenu && (
              <div className="absolute right-0 top-[calc(100%+12px)] z-[60] w-[min(360px,calc(100vw-2rem))]">
                {user?._id ? (
                  <Usermenu onNavigate={() => setOpenMenu(false)} onClose={() => setOpenMenu(false)} />
                ) : (
                  <div className="relative rounded-2xl border border-gray-100 bg-white p-4 pr-12 shadow-xl">
                    <button type="button" onClick={() => setOpenMenu(false)} aria-label="Close profile menu" className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-gray-100 text-lg text-gray-600 hover:bg-gray-200">×</button>
                    <p className="mb-3 text-sm font-semibold text-gray-800">Welcome to PrimeCommerce</p>
                    <Link to="/login" className="block rounded-xl bg-[#176b36] px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-[#10572b]">Login / Sign up</Link>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate("/cart")}
            aria-label={`Open cart, ${user?._id ? cartCount : 0} items`}
            className="relative flex items-center gap-2 rounded-xl bg-[#176b36] px-3 py-2.5 text-white shadow-sm transition hover:bg-[#10572b] sm:px-4"
          >
            <FaShoppingBasket className="text-lg" />
            <span className="hidden text-sm font-bold sm:inline">Cart</span>
            {user?._id && cartCount > 0 && <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-[#f6c945] px-1 text-[10px] font-extrabold text-gray-900">{cartCount}</span>}
          </button>
        </div>
      </div>

      <div className="border-t border-gray-100 bg-[#fffdf7] md:hidden">
        <div className="mx-auto max-w-[1440px] px-4 py-2.5">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-600">
            <FaMapMarkerAlt className="text-[#16833b]" />
            <span>Delivering to</span>
            <button type="button" onClick={() => navigate("/dashboard/address")} className="font-extrabold text-gray-900">Add delivery address <FaChevronDown className="ml-1 inline text-[9px]" /></button>
          </div>
          <Search />
        </div>
      </div>

    </header>
  );
};

export default Header;
