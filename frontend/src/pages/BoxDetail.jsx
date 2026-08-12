import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import * as Phosphor from "@phosphor-icons/react";
import { ArrowLeft, ShoppingBag, Sparkle, Check } from "@phosphor-icons/react";
import { api } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";

const TIERS = [
  { key: "starter", label: "Starter", price: 299, items: "3–4 items" },
  { key: "premium", label: "Premium", price: 599, items: "5–7 items" },
  { key: "mega", label: "Mega", price: 999, items: "8+ items" },
];

export default function BoxDetail() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { addItem } = useCart();
  const [box, setBox] = useState(null);
  const [tier, setTier] = useState("premium");

  useEffect(() => {
    api.get(`/boxes/${slug}`).then((r) => setBox(r.data)).catch(() => setBox(false));
  }, [slug]);

  if (box === null) return <div className="min-h-[60vh] grid place-items-center font-display font-black text-2xl">Loading…</div>;
  if (box === false) return <div className="min-h-[60vh] grid place-items-center font-display font-black text-2xl">Box not found</div>;

  const Icon = Phosphor[box.emoji] || Phosphor.Gift;

  return (
    <main className="max-w-[1400px] mx-auto px-5 md:px-10 py-12" data-testid="box-detail">
      <Link to="/#boxes" className="inline-flex items-center gap-2 font-bold uppercase text-sm mb-8 hover:text-[#FF007F]">
        <ArrowLeft size={18} weight="bold" /> All boxes
      </Link>
      <div className="grid lg:grid-cols-2 gap-10">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="brutal-lg rounded-2xl overflow-hidden" style={{ background: box.color }}>
          <img src={box.image} alt={box.name} className="w-full h-[480px] object-cover" data-testid="box-image" />
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
          <div className="w-14 h-14 grid place-items-center brutal-sm rounded-full mb-4" style={{ background: box.color }}>
            <Icon size={28} weight="bold" />
          </div>
          <h1 className="font-display font-black text-5xl md:text-6xl tracking-tighter leading-[0.9]">{box.name}</h1>
          <p className="mt-4 text-lg font-medium text-[#09090B]/70">{box.description}</p>

          <div className="mt-6 inline-flex items-center gap-2 bg-[#39FF14] brutal-sm rounded-full px-4 py-2 font-bold text-sm">
            <Sparkle size={16} weight="fill" /> Contents worth up to 2× the price
          </div>

          <div className="mt-8">
            <p className="font-bold uppercase text-sm tracking-widest mb-3">Choose your tier</p>
            <div className="grid grid-cols-3 gap-3">
              {TIERS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTier(t.key)}
                  className={`brutal-sm rounded-xl p-4 text-left press ${tier === t.key ? "bg-[#FFEA00]" : "bg-white"}`}
                  data-testid={`tier-${t.key}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display font-black text-lg">{t.label}</span>
                    {tier === t.key && <Check size={18} weight="bold" />}
                  </div>
                  <div className="font-display font-black text-2xl">₹{t.price}</div>
                  <div className="text-xs font-medium text-[#09090B]/60">{t.items}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => { addItem(box, tier); toast.success(`${box.name} (${tier}) added to cart`); }}
              className="flex-1 bg-white brutal rounded-full py-4 font-bold uppercase tracking-wide press flex items-center justify-center gap-2"
              data-testid="add-to-cart-btn"
            >
              <ShoppingBag size={20} weight="bold" /> Add to Cart
            </button>
            <button
              onClick={() => { addItem(box, tier); nav("/cart"); }}
              className="flex-1 bg-[#FF007F] text-white brutal rounded-full py-4 font-bold uppercase tracking-wide press"
              data-testid="buy-now-btn"
            >
              Buy Now
            </button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
