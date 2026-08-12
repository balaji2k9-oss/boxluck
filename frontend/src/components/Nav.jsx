import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ShoppingBag, User, List, X } from "@phosphor-icons/react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

export const Nav = () => {
  const { count } = useCart();
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 bg-[#FDFBF7] border-b-[3px] border-[#09090B]"
      data-testid="main-nav"
    >
      <div className="max-w-[1400px] mx-auto px-5 md:px-10 h-[70px] flex items-center justify-between">
        <Link to="/" className="font-display font-black text-xl md:text-2xl tracking-tighter" data-testid="nav-logo">
          MYSTERY<span className="text-[#FF007F]">BOX</span>
          <span className="text-[#8A2BE2]">.IN</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 font-semibold text-sm uppercase tracking-wide">
          <a href="/#boxes" className="hover:text-[#FF007F] transition-colors" data-testid="nav-boxes">Boxes</a>
          <a href="/#pricing" className="hover:text-[#FF007F] transition-colors" data-testid="nav-pricing">Pricing</a>
          <a href="/#subscribe" className="hover:text-[#FF007F] transition-colors" data-testid="nav-subscribe">Subscribe</a>
          <a href="/#golden" className="hover:text-[#FF007F] transition-colors" data-testid="nav-golden">Golden Box</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/cart"
            className="relative w-11 h-11 grid place-items-center bg-white brutal-sm rounded-full press"
            data-testid="nav-cart"
          >
            <ShoppingBag size={20} weight="bold" />
            {count > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-5 h-5 px-1 grid place-items-center bg-[#FF007F] text-white text-xs font-bold rounded-full border-2 border-[#09090B]"
                data-testid="cart-count"
              >
                {count}
              </span>
            )}
          </Link>

          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <Link to="/account" className="w-11 h-11 grid place-items-center bg-[#00F0FF] brutal-sm rounded-full press" data-testid="nav-account">
                <User size={20} weight="bold" />
              </Link>
              <button
                onClick={async () => { await logout(); nav("/"); }}
                className="text-xs font-bold uppercase underline"
                data-testid="nav-logout"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden md:block bg-[#FFEA00] brutal-sm rounded-full px-5 py-2.5 font-bold text-sm uppercase press"
              data-testid="nav-login"
            >
              Login
            </Link>
          )}

          <button className="md:hidden w-11 h-11 grid place-items-center brutal-sm rounded-full bg-white" onClick={() => setOpen(!open)} data-testid="nav-menu-toggle">
            {open ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t-[3px] border-[#09090B] bg-[#FDFBF7] px-5 py-4 flex flex-col gap-3 font-bold uppercase text-sm">
          <a href="/#boxes" onClick={() => setOpen(false)}>Boxes</a>
          <a href="/#pricing" onClick={() => setOpen(false)}>Pricing</a>
          <a href="/#subscribe" onClick={() => setOpen(false)}>Subscribe</a>
          <a href="/#golden" onClick={() => setOpen(false)}>Golden Box</a>
          {user ? (
            <>
              <Link to="/account" onClick={() => setOpen(false)}>My Account</Link>
              <button className="text-left" onClick={async () => { await logout(); setOpen(false); }}>Logout</button>
            </>
          ) : (
            <Link to="/login" onClick={() => setOpen(false)}>Login</Link>
          )}
        </div>
      )}
    </header>
  );
};
