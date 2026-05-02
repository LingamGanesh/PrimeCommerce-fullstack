import React, { useState } from "react";
import { FaShoppingCart, FaUserCircle, FaArrowAltCircleLeft } from "react-icons/fa";
import { IoMdArrowDropupCircle, IoMdArrowDropdownCircle } from "react-icons/io";
import logo from "../assets/logo.png";
import Search from "./Search";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useMobile from "../hooks/useMobile";
import { useSelector } from "react-redux";
import { Usermenu } from "./Usermenu";

const Header = () => {
  const [isMobile] = useMobile();
  const location = useLocation();
  const navigate = useNavigate();

  const [openMenu, setOpenMenu] = useState(false);
  const user = useSelector((state) => state.user);

  const isSearchPage = location.pathname === "/search";

  const toggleMenu = () => setOpenMenu((prev) => !prev);

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">

      {/* ================= SEARCH PAGE ================= */}
      {(isSearchPage && isMobile) && (
        <div className="h-20 max-w-7xl mx-auto px-4 flex items-center gap-3">

          <button onClick={() => navigate(-1)}>
            <FaArrowAltCircleLeft size={24} />
          </button>

          <Link to="/">
            <img src={logo} width={120} alt="logo" />
          </Link>

          <div className="flex-1">
            <Search />
          </div>

          {/* ONLY ICON IN MOBILE */}
          <button onClick={toggleMenu}>
            <FaUserCircle size={26} />
          </button>
        </div>
      )}

      {/* ================= MAIN HEADER ================= */}
      {!(isSearchPage && isMobile) && (
        <>
          <div className="h-20 max-w-7xl mx-auto px-4 flex items-center justify-between">

            {/* LOGO */}
            <Link to="/">
              <img src={logo} width={160} alt="logo" />
            </Link>

            {/* SEARCH */}
            <div className="hidden lg:block w-1/2">
              <Search />
            </div>

            {/* RIGHT SIDE */}
            <div className="flex items-center gap-5">

              {/* ================= DESKTOP USER ================= */}
              <div className="relative hidden lg:block">

                {user?._id ? (
                  <div
                    onClick={toggleMenu}
                    className="flex items-center gap-2 cursor-pointer select-none"
                  >
                    <FaUserCircle size={22} />
                    <p>Account</p>

                    {openMenu ? (
                      <IoMdArrowDropupCircle />
                    ) : (
                      <IoMdArrowDropdownCircle />
                    )}
                  </div>
                ) : (
                  <Link to="/login" className="text-gray-700">
                    Login
                  </Link>
                )}

              </div>

              {/* ================= MOBILE USER ICON ONLY ================= */}
              <button
                className="lg:hidden"
                onClick={toggleMenu}
              >
                <FaUserCircle size={26} />
              </button>

              {/* CART */}
              <button className="relative text-gray-700">
                <FaShoppingCart size={20} />
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  10
                </span>
              </button>

            </div>
          </div>

          {/* ================= GLOBAL DROPDOWN (ONE PLACE) ================= */}
          {openMenu && (
            <div className="absolute right-4 top-20 z-50">
              {user?._id ? (
                <Usermenu />
              ) : (
                <div className="bg-white shadow-md p-4 rounded-xl">
                  <Link to="/login" className="text-blue-600 font-medium">
                    Login to continue
                  </Link>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </header>
  );
};

export default Header;