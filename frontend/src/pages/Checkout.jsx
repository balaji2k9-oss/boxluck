import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Truck, CreditCard } from "@phosphor-icons/react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const SUB_PRICE = { starter: 299, premium: 599, mega: 999 };

export default function Checkout() {
  const [params] = useSearchParams();
  const subPlan = params.get("sub"); // subscription mode
  const nav = useNavigate();
  const { items, total, clear } = useCart();
  const { user } = useAuth();
  const [method, setMethod] = useState("cod");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "", city: "", pincode: "" });

  useEffect(() => {
    if (user === false) nav("/login?next=/checkout" + (subPlan ? `?sub=${subPlan}` : ""));
    if (user) setForm((f) => ({ ...f, name: f.name || user.name }));
  }, [user]); // eslint-disable-line

  const amount = subPlan ? SUB_PRICE[subPlan] : total;
  const isEmpty = !subPlan && items.length === 0;

  const submit = async (e) => {
    e.preventDefault();
    if (isEmpty) return toast.error("Your cart is empty");
    if (!form.name || !form.phone || !form.address || !form.pincode) return toast.error("Please fill all shipping fields");
    setLoading(true);
    try {
      const origin_url = window.location.origin;
      if (subPlan) {
        const { data } = await api.post("/subscribe", { plan: subPlan, method, origin_url, shipping: form });
        if (data.checkout_url) { window.location.href = data.checkout_url; return; }
        toast.success("Subscription active! See you monthly 🎁");
        nav("/account");
      } else {
        const payloadItems = items.map((i) => ({ box_id: i.box_id, tier: i.tier, quantity: i.quantity }));
        const { data } = await api.post("/checkout", { items: payloadItems, method, origin_url, shipping: form });
        if (data.checkout_url) { window.location.href = data.checkout_url; return; }
        clear();
        toast.success("Order placed! Get ready to unbox 🎉");
        nav("/account");
      }
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  if (user === null) return <div className="min-h-[50vh] grid place-items-center font-display font-black text-2xl">Loading…</div>;

  return (
    <main className="max-w-[1000px] mx-auto px-5 md:px-10 py-12" data-testid="checkout-page">
      <h1 className="font-display font-black text-5xl md:text-6xl tracking-tighter mb-2">CHECKOUT</h1>
      <p className="font-medium text-[#09090B]/60 mb-8">{subPlan ? `Monthly ${subPlan} subscription` : `${items.length} item(s) in your cart`}</p>

      {isEmpty ? (
        <div className="brutal rounded-2xl bg-white p-8 text-center">
          <p className="font-bold">Your cart is empty.</p>
          <Link to="/#boxes" className="inline-block mt-4 bg-[#FF007F] text-white brutal rounded-full px-6 py-3 font-bold uppercase press">Shop Boxes</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="brutal rounded-2xl bg-white p-6">
              <h2 className="font-display font-black text-2xl flex items-center gap-2 mb-4"><Truck size={24} weight="bold" /> Shipping</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" className="brutal-sm rounded-xl px-4 py-3 font-medium outline-none" data-testid="ship-name" />
                <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="brutal-sm rounded-xl px-4 py-3 font-medium outline-none" data-testid="ship-phone" />
                <input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" className="brutal-sm rounded-xl px-4 py-3 font-medium outline-none sm:col-span-2" data-testid="ship-address" />
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" className="brutal-sm rounded-xl px-4 py-3 font-medium outline-none" data-testid="ship-city" />
                <input required value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} placeholder="Pincode" className="brutal-sm rounded-xl px-4 py-3 font-medium outline-none" data-testid="ship-pincode" />
              </div>
            </div>

            <div className="brutal rounded-2xl bg-white p-6">
              <h2 className="font-display font-black text-2xl flex items-center gap-2 mb-4"><CreditCard size={24} weight="bold" /> Payment</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <button type="button" onClick={() => setMethod("cod")} className={`brutal-sm rounded-xl p-4 text-left press ${method === "cod" ? "bg-[#FFEA00]" : "bg-white"}`} data-testid="pay-cod">
                  <div className="font-display font-black text-lg">Cash on Delivery</div>
                  <div className="text-sm font-medium text-[#09090B]/60">Pay when it arrives</div>
                </button>
                <button type="button" onClick={() => setMethod("stripe")} className={`brutal-sm rounded-xl p-4 text-left press ${method === "stripe" ? "bg-[#00F0FF]" : "bg-white"}`} data-testid="pay-stripe">
                  <div className="font-display font-black text-lg">Pay by Card</div>
                  <div className="text-sm font-medium text-[#09090B]/60">Secure Stripe checkout</div>
                </button>
              </div>
            </div>
          </div>

          <div className="brutal-lg rounded-2xl bg-[#8A2BE2] text-white p-6 h-fit sticky top-24" data-testid="checkout-summary">
            <h2 className="font-display font-black text-2xl">Order Total</h2>
            <div className="mt-4 flex justify-between font-medium"><span>Amount</span><span>₹{amount}</span></div>
            <div className="mt-1 flex justify-between font-medium"><span>Shipping</span><span>FREE</span></div>
            <div className="mt-4 pt-4 border-t-2 border-white/30 flex justify-between font-display font-black text-2xl"><span>Total</span><span>₹{amount}</span></div>
            <button type="submit" disabled={loading} className="mt-6 w-full bg-[#FFEA00] text-[#09090B] brutal rounded-full py-4 font-bold uppercase press disabled:opacity-60" data-testid="place-order-btn">
              {loading ? "Processing…" : method === "cod" ? "Place Order" : "Pay Now"}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
