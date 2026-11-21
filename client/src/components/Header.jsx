import { useEffect, useState } from "react";
import { FaShoppingBasket, FaUserCircle, FaChevronDown, FaMapMarkerAlt } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Axios from "../utils/Axios";
import { Usermenu } from "./Usermenu";
import Search from "./Search";
import primeCommerceLogo from "../assets/prime-commerce-logo.svg";

const navItems = [
  { label: "Shop", target: "products" },
  { label: "Categories", target: "categories" },
  { label: "Fresh arrivals", target: "fresh-arrivals" },
  { label: "Offers", target: "live-offers" },
];

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const [openMenu, setOpenMenu] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    let active = true;
    if (!user?._id) { setCartCount(0); return () => { active = false; }; }
    Axios.get("/api/v1/cart")
      .then((response) => { if (active) setCartCount(response.data?.data?.itemCount || 0); })
      .catch(() => { if (active) setCartCount(0); });
    return () => { active = false; };
  }, [user?._id, location.pathname]);

  const scrollToSection = (target) => {
    if (location.pathname !== "/") { navigate("/"); window.setTimeout(() => document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" }), 250); return; }
    document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#e9e8df] bg-[#fffefa]/95 shadow-[0_5px_24px_rgba(20,40,28,.045)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-3 sm:px-6 lg:gap-7 lg:px-8">
        <Link to="/" aria-label="Go to homepage" className="flex shrink-0 items-center">
          <img src={primeCommerceLogo} alt="Prime Commerce" className="h-10 w-auto max-w-[164px] object-contain sm:h-12 sm:max-w-[190px]" />
        </Link>

        <div className="hidden min-w-[165px] shrink-0 border-l border-[#e8e6dc] pl-5 lg:block">
          <p className="text-[9px] font-extrabold uppercase tracking-[.2em] text-[#8b9186]">Delivering to</p>
          <button type="button" className="mt-1 flex items-center gap-1.5 text-left text-[13px] font-extrabold text-[#1d2d22]" onClick={() => navigate("/dashboard/address")}>
            <FaMapMarkerAlt className="text-[#237747]" /><span>Add delivery address</span><FaChevronDown className="text-[9px] text-gray-400" />
          </button>
        </div>

        <div className="hidden min-w-0 flex-1 md:block"><Search /></div>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-4">
          <div className="relative">
            <button type="button" onClick={() => setOpenMenu((value) => !value)} aria-expanded={openMenu} aria-label={user?._id ? "Open account menu" : "Login"} className="flex items-center gap-2 rounded-full px-2.5 py-2 text-sm font-bold text-[#334237] transition hover:bg-[#f1f4ed]">
              <FaUserCircle className="text-xl text-[#315b3f] sm:text-2xl" /><span className="hidden sm:inline">{user?._id ? "Account" : "Login"}</span><FaChevronDown className="hidden text-[9px] text-gray-500 sm:inline" />
            </button>
            {openMenu && <div className="absolute right-0 top-[calc(100%+12px)] z-[60] w-[min(360px,calc(100vw-2rem))]">{user?._id ? <Usermenu onNavigate={() => setOpenMenu(false)} onClose={() => setOpenMenu(false)} /> : <div className="relative rounded-2xl border border-gray-100 bg-white p-4 pr-12 shadow-xl"><button type="button" onClick={() => setOpenMenu(false)} aria-label="Close profile menu" className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-gray-100 text-lg text-gray-600 hover:bg-gray-200">×</button><p className="mb-3 text-sm font-semibold text-gray-800">Welcome to PrimeCommerce</p><Link to="/login" className="block rounded-xl bg-[#176b36] px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-[#10572b]">Login / Sign up</Link></div>}</div>}
          </div>
          <button type="button" onClick={() => navigate("/cart")} aria-label={`Open cart, ${user?._id ? cartCount : 0} items`} className="relative flex items-center gap-2 rounded-full bg-[#176b3b] px-3.5 py-2.5 text-white shadow-[0_5px_14px_rgba(23,107,59,.2)] transition hover:-translate-y-0.5 hover:bg-[#10572b] sm:px-5">
            <FaShoppingBasket className="text-lg" /><span className="hidden text-sm font-extrabold sm:inline">Cart</span>
            {user?._id && cartCount > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-[#f3c94f] px-1 text-[10px] font-extrabold text-gray-900">{cartCount}</span>}
          </button>
        </div>
      </div>

      <div className="border-t border-[#efeee7] bg-white/80 md:hidden">
        <div className="px-4 pb-2 pt-2"><div className="mb-2 flex items-center gap-2 text-[11px] font-semibold text-gray-600"><FaMapMarkerAlt className="text-[#16833b]" /><span>Delivering to</span><button type="button" onClick={() => navigate("/dashboard/address")} className="font-extrabold text-gray-900">Add delivery address <FaChevronDown className="ml-1 inline text-[9px]" /></button></div><Search /></div>
      </div>

      <nav aria-label="Main navigation" className="border-t border-[#efeee7] bg-[#fbfcf7]">
        <div className="mx-auto flex max-w-[1440px] items-center gap-1 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-6 lg:px-8">
          <span className="mr-3 hidden shrink-0 items-center gap-2 text-[9px] font-black uppercase tracking-[.2em] text-[#8a9387] lg:flex"><span className="h-1.5 w-1.5 rounded-full bg-[#65a36d]" /> Explore</span>
          {navItems.map((item, index) => <button key={item.target} type="button" onClick={() => scrollToSection(item.target)} className={`shrink-0 rounded-full px-4 py-2 text-[11px] font-extrabold transition-all ${index === 0 ? "bg-[#eaf2e9] text-[#21613a] hover:bg-[#dcebdc]" : "text-[#5c685d] hover:bg-[#edf2e9] hover:text-[#21613a]"}`}>{item.label}</button>)}
          <span className="ml-auto hidden shrink-0 text-[10px] font-semibold text-[#899187] lg:block">Thoughtful picks for everyday living</span>
        </div>
      </nav>
    </header>
  );
};

export default Header;
