import { Link } from 'react-router-dom'

const Footer = () => {
  const year = new Date().getFullYear()

  return (
    <footer className="relative mt-16 overflow-hidden bg-[#0d261b] text-white">
      <div className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-36 left-1/4 h-80 w-80 rounded-full bg-lime-300/10 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-5 pb-7 pt-12 sm:px-8 sm:pt-16">
        <div className="mb-10 grid gap-8 rounded-[26px] border border-white/10 bg-white/[.06] p-5 backdrop-blur sm:grid-cols-3 sm:items-center sm:p-7">
          <div className="sm:col-span-2">
            <span className="text-[9px] font-black uppercase tracking-[.22em] text-lime-300">The Prime promise</span>
            <h2 className="mt-2 text-xl font-black tracking-tight sm:text-2xl">Everyday shopping, made a little better.</h2>
            <p className="mt-2 max-w-xl text-xs leading-6 text-emerald-50/65">Discover daily essentials, explore new favourites and make your home routine feel effortless.</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Link to="/search" className="rounded-full bg-lime-300 px-5 py-3 text-[10px] font-black text-[#102b20] transition hover:-translate-y-0.5 hover:bg-lime-200">Explore store ↗</Link>
            <Link to="/cart" className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-[10px] font-bold text-white transition hover:bg-white/15">View basket</Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-9 border-b border-white/10 pb-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-lime-300 text-xl text-[#102b20] shadow-lg shadow-black/20">✳</span>
              <span><span className="block text-lg font-black tracking-tight">Prime<span className="text-lime-300">Commerce</span></span><span className="mt-0.5 block text-[8px] font-bold uppercase tracking-[.2em] text-emerald-100/55">Fresh finds. Everyday ease.</span></span>
            </Link>
            <p className="mt-4 max-w-xs text-xs leading-6 text-emerald-50/60">Your everyday destination for groceries, pantry staples and thoughtful essentials.</p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-200/15 bg-emerald-300/10 px-3 py-2 text-[9px] font-bold text-emerald-100/80"><span className="h-1.5 w-1.5 rounded-full bg-lime-300" /> Made for everyday living</div>
          </div>

          <div>
            <h3 className="mb-4 text-[10px] font-black uppercase tracking-[.18em] text-lime-300">Explore</h3>
            <ul className="space-y-3 text-xs text-emerald-50/65">
              <li><Link to="/" className="transition hover:text-white">Home</Link></li>
              <li><Link to="/search" className="transition hover:text-white">Search products</Link></li>
              <li><Link to="/cart" className="transition hover:text-white">Shopping cart</Link></li>
              <li><Link to="/#categories" className="transition hover:text-white">Shop categories</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-[10px] font-black uppercase tracking-[.18em] text-lime-300">Your account</h3>
            <ul className="space-y-3 text-xs text-emerald-50/65">
              <li><Link to="/login" className="transition hover:text-white">Sign in</Link></li>
              <li><Link to="/register" className="transition hover:text-white">Create account</Link></li>
              <li><Link to="/dashboard/myorders" className="transition hover:text-white">My orders</Link></li>
              <li><Link to="/dashboard/profile" className="transition hover:text-white">My profile</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-[10px] font-black uppercase tracking-[.18em] text-lime-300">Need help?</h3>
            <ul className="space-y-3 text-xs text-emerald-50/65">
              <li><Link to="/dashboard/support" className="transition hover:text-white">Customer support</Link></li>
              <li><Link to="/dashboard/address" className="transition hover:text-white">Saved addresses</Link></li>
              <li><Link to="/checkout" className="transition hover:text-white">Checkout</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-6 text-[10px] text-emerald-50/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} PrimeCommerce. All rights reserved.</p>
          <div className="flex items-center gap-4"><Link to="/" className="transition hover:text-white">Home</Link><span className="h-1 w-1 rounded-full bg-emerald-400/50" /><Link to="/search" className="transition hover:text-white">Browse store</Link><span className="h-1 w-1 rounded-full bg-emerald-400/50" /><span>Thoughtfully made for your everyday</span></div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
