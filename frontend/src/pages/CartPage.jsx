import { Link, useNavigate } from "react-router-dom";
import { Plus, Minus, Trash, ShoppingBag } from "@phosphor-icons/react";
import { useCart } from "@/context/CartContext";

const LABEL = { starter: "Starter ₹299", premium: "Premium ₹599", mega: "Mega ₹999" };

export default function CartPage() {
  const { items, updateQty, removeItem, total, TIER_PRICES } = useCart();
  const nav = useNavigate();

  if (items.length === 0)
    return (
      <main className="max-w-[900px] mx-auto px-5 md:px-10 py-24 text-center" data-testid="cart-empty">
        <div className="w-20 h-20 grid place-items-center brutal rounded-full bg-[#FFEA00] mx-auto mb-6">
          <ShoppingBag size={36} weight="bold" />
        </div>
        <h1 className="font-display font-black text-5xl tracking-tighter">YOUR CART IS EMPTY</h1>
        <p className="mt-3 font-medium text-[#09090B]/60">No surprises yet. Let's fix that.</p>
        <Link to="/#boxes" className="inline-block mt-8 bg-[#FF007F] text-white brutal rounded-full px-8 py-4 font-bold uppercase press" data-testid="cart-shop-btn">
          Shop Boxes
        </Link>
      </main>
    );

  return (
    <main className="max-w-[1100px] mx-auto px-5 md:px-10 py-12" data-testid="cart-page">
      <h1 className="font-display font-black text-5xl md:text-6xl tracking-tighter mb-8">YOUR CART</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((it) => (
            <div key={it.box_id + it.tier} className="flex items-center gap-4 brutal rounded-2xl bg-white p-4" data-testid={`cart-item-${it.box_id}-${it.tier}`}>
              <div className="w-20 h-20 rounded-xl overflow-hidden brutal-sm shrink-0" style={{ background: it.color }}>
                <img src={it.image} alt={it.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-black text-xl leading-tight">{it.name}</h3>
                <p className="text-sm font-bold text-[#8A2BE2]">{LABEL[it.tier]}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQty(it.box_id, it.tier, -1)} className="w-8 h-8 grid place-items-center brutal-sm rounded-full bg-white press" data-testid={`qty-dec-${it.box_id}-${it.tier}`}><Minus size={14} weight="bold" /></button>
                <span className="w-6 text-center font-bold">{it.quantity}</span>
                <button onClick={() => updateQty(it.box_id, it.tier, 1)} className="w-8 h-8 grid place-items-center brutal-sm rounded-full bg-white press" data-testid={`qty-inc-${it.box_id}-${it.tier}`}><Plus size={14} weight="bold" /></button>
              </div>
              <div className="w-20 text-right font-display font-black text-lg">₹{TIER_PRICES[it.tier] * it.quantity}</div>
              <button onClick={() => removeItem(it.box_id, it.tier)} className="text-[#FF007F]" data-testid={`remove-${it.box_id}-${it.tier}`}><Trash size={20} weight="bold" /></button>
            </div>
          ))}
        </div>
        <div className="brutal-lg rounded-2xl bg-[#FFEA00] p-6 h-fit sticky top-24" data-testid="cart-summary">
          <h2 className="font-display font-black text-2xl">Summary</h2>
          <div className="mt-4 flex justify-between font-medium"><span>Subtotal</span><span>₹{total}</span></div>
          <div className="mt-1 flex justify-between font-medium"><span>Shipping</span><span>FREE</span></div>
          <div className="mt-4 pt-4 border-t-2 border-[#09090B] flex justify-between font-display font-black text-2xl"><span>Total</span><span>₹{total}</span></div>
          <button onClick={() => nav("/checkout")} className="mt-6 w-full bg-[#09090B] text-white brutal rounded-full py-4 font-bold uppercase press" data-testid="checkout-btn">
            Checkout
          </button>
        </div>
      </div>
    </main>
  );
}
