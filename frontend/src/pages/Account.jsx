import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Package, ArrowRight } from "@phosphor-icons/react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const STATUS_COLOR = { placed: "#39FF14", active: "#00F0FF", pending_payment: "#FFEA00" };

export default function Account() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (user === false) nav("/login?next=/account");
    if (user) api.get("/orders").then((r) => setOrders(r.data)).catch(() => {});
  }, [user]); // eslint-disable-line

  if (!user) return <div className="min-h-[50vh] grid place-items-center font-display font-black text-2xl">Loading…</div>;

  return (
    <main className="max-w-[1000px] mx-auto px-5 md:px-10 py-12" data-testid="account-page">
      <div className="brutal-lg rounded-2xl bg-[#FFEA00] p-8 mb-8">
        <p className="font-bold uppercase text-sm tracking-widest">Your account</p>
        <h1 className="font-display font-black text-4xl md:text-5xl tracking-tighter mt-1">HEY, {user.name?.toUpperCase()}</h1>
        <p className="font-medium mt-1">{user.email}</p>
      </div>

      <h2 className="font-display font-black text-3xl tracking-tighter mb-4">ORDER HISTORY</h2>
      {orders.length === 0 ? (
        <div className="brutal rounded-2xl bg-white p-8 text-center" data-testid="no-orders">
          <div className="w-16 h-16 grid place-items-center brutal-sm rounded-full bg-[#00F0FF] mx-auto mb-4"><Package size={30} weight="bold" /></div>
          <p className="font-bold">No orders yet.</p>
          <Link to="/#boxes" className="inline-flex items-center gap-2 mt-4 bg-[#FF007F] text-white brutal rounded-full px-6 py-3 font-bold uppercase press">
            Shop your first box <ArrowRight size={18} weight="bold" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="brutal rounded-2xl bg-white p-6" data-testid={`order-${o.id}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#09090B]/50">{o.type}</span>
                  <div className="font-display font-black text-xl">₹{o.amount} · {o.method?.toUpperCase()}</div>
                </div>
                <span className="brutal-sm rounded-full px-4 py-1.5 font-bold text-sm uppercase" style={{ background: STATUS_COLOR[o.status] || "#eee" }}>
                  {o.status?.replace("_", " ")}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {o.items?.map((it, i) => (
                  <span key={i} className="text-sm font-medium bg-[#FDFBF7] brutal-sm rounded-full px-3 py-1">
                    {it.name} × {it.quantity} <span className="text-[#8A2BE2]">({it.tier})</span>
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs font-medium text-[#09090B]/50">Payment: {o.payment_status}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
