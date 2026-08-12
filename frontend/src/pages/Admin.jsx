import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChartBar, Package, ShoppingBag, Users, Plus, FloppyDisk, Trash, CurrencyInr } from "@phosphor-icons/react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const EMPTY_BOX = { slug: "", name: "", emoji: "Gift", tagline: "", description: "", color: "#FFEA00", image: "", prices: { starter: 299, premium: 599, mega: 999 } };

const StatCard = ({ icon, label, value, color }) => (
  <div className="brutal rounded-2xl p-6" style={{ background: color }} data-testid={`stat-${label.toLowerCase()}`}>
    <div className="w-11 h-11 grid place-items-center bg-white brutal-sm rounded-full mb-3">{icon}</div>
    <div className="font-display font-black text-4xl tracking-tighter">{value}</div>
    <div className="font-bold uppercase text-xs tracking-widest mt-1">{label}</div>
  </div>
);

const BoxRow = ({ box, onSaved, onDeleted }) => {
  const [prices, setPrices] = useState(box.prices || { starter: 299, premium: 599, mega: 999 });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/boxes/${box.slug}`, { prices: {
        starter: Number(prices.starter), premium: Number(prices.premium), mega: Number(prices.mega),
      } });
      toast.success(`${box.name} prices updated`);
      onSaved();
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    } finally { setSaving(false); }
  };
  const del = async () => {
    if (!window.confirm(`Delete ${box.name}?`)) return;
    try {
      await api.delete(`/admin/boxes/${box.slug}`);
      toast.success("Box deleted");
      onDeleted();
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
  };

  return (
    <div className="brutal rounded-2xl bg-white p-4 flex flex-wrap items-center gap-4" data-testid={`admin-box-${box.slug}`}>
      <div className="w-16 h-16 rounded-xl overflow-hidden brutal-sm shrink-0" style={{ background: box.color }}>
        {box.image ? <img src={box.image} alt={box.name} className="w-full h-full object-cover" /> : null}
      </div>
      <div className="min-w-[160px] flex-1">
        <div className="font-display font-black text-lg leading-tight">{box.name}</div>
        <div className="text-xs font-bold text-[#8A2BE2]">/{box.slug}</div>
      </div>
      {["starter", "premium", "mega"].map((t) => (
        <label key={t} className="flex flex-col text-xs font-bold uppercase tracking-wide">
          {t}
          <div className="flex items-center brutal-sm rounded-lg bg-[#FDFBF7] px-2 mt-1">
            <CurrencyInr size={14} weight="bold" />
            <input
              type="number" value={prices[t]}
              onChange={(e) => setPrices({ ...prices, [t]: e.target.value })}
              className="w-20 bg-transparent py-2 px-1 outline-none font-bold"
              data-testid={`price-${box.slug}-${t}`}
            />
          </div>
        </label>
      ))}
      <button onClick={save} disabled={saving} className="bg-[#39FF14] brutal-sm rounded-full px-4 py-2.5 font-bold text-sm uppercase press flex items-center gap-1" data-testid={`save-${box.slug}`}>
        <FloppyDisk size={16} weight="bold" /> {saving ? "…" : "Save"}
      </button>
      <button onClick={del} className="bg-[#FF007F] text-white brutal-sm rounded-full w-10 h-10 grid place-items-center press" data-testid={`delete-${box.slug}`}>
        <Trash size={16} weight="bold" />
      </button>
    </div>
  );
};

export default function Admin() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [boxes, setBoxes] = useState([]);
  const [newBox, setNewBox] = useState(EMPTY_BOX);
  const [adding, setAdding] = useState(false);

  const load = () => {
    api.get("/admin/stats").then((r) => setStats(r.data)).catch(() => {});
    api.get("/admin/orders").then((r) => setOrders(r.data)).catch(() => {});
    api.get("/boxes").then((r) => setBoxes(r.data)).catch(() => {});
  };

  useEffect(() => {
    if (user === false) { nav("/login?next=/admin"); return; }
    if (user && user.role !== "admin") { toast.error("Admins only"); nav("/"); return; }
    if (user) load();
  }, [user]); // eslint-disable-line

  const addBox = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      await api.post("/admin/boxes", {
        ...newBox, slug: newBox.slug.trim().toLowerCase(),
        prices: { starter: Number(newBox.prices.starter), premium: Number(newBox.prices.premium), mega: Number(newBox.prices.mega) },
      });
      toast.success("Box created!");
      setNewBox(EMPTY_BOX);
      load();
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
    finally { setAdding(false); }
  };

  if (!user || user.role !== "admin") return <div className="min-h-[50vh] grid place-items-center font-display font-black text-2xl">Loading…</div>;

  const TABS = [["overview", "Overview"], ["orders", "Orders"], ["boxes", "Boxes"]];

  return (
    <main className="max-w-[1300px] mx-auto px-5 md:px-10 py-12" data-testid="admin-page">
      <div className="brutal-lg rounded-2xl bg-[#09090B] text-white p-8 mb-8">
        <p className="font-bold uppercase text-sm tracking-widest text-[#FFEA00]">Control Room</p>
        <h1 className="font-display font-black text-4xl md:text-5xl tracking-tighter mt-1">ADMIN DASHBOARD</h1>
      </div>

      <div className="flex gap-3 mb-8">
        {TABS.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`brutal-sm rounded-full px-6 py-2.5 font-bold uppercase text-sm press ${tab === k ? "bg-[#FF007F] text-white" : "bg-white"}`} data-testid={`tab-${k}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === "overview" && stats && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="overview">
          <StatCard icon={<ShoppingBag size={22} weight="bold" />} label="Orders" value={stats.orders} color="#00F0FF" />
          <StatCard icon={<CurrencyInr size={22} weight="bold" />} label="Revenue" value={`₹${stats.revenue}`} color="#FFEA00" />
          <StatCard icon={<Package size={22} weight="bold" />} label="Boxes" value={stats.boxes} color="#39FF14" />
          <StatCard icon={<Users size={22} weight="bold" />} label="Customers" value={stats.customers} color="#FF007F" />
        </motion.div>
      )}

      {tab === "orders" && (
        <div className="space-y-4" data-testid="admin-orders">
          {orders.length === 0 ? <p className="font-bold">No orders yet.</p> : orders.map((o) => (
            <div key={o.id} className="brutal rounded-2xl bg-white p-5" data-testid={`admin-order-${o.id}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#09090B]/50">{o.type} · {o.user_email}</span>
                  <div className="font-display font-black text-xl">₹{o.amount} · {o.method?.toUpperCase()}</div>
                </div>
                <span className="brutal-sm rounded-full px-4 py-1.5 font-bold text-sm uppercase bg-[#FFEA00]">{o.status?.replace("_", " ")}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {o.items?.map((it, i) => (
                  <span key={i} className="text-sm font-medium bg-[#FDFBF7] brutal-sm rounded-full px-3 py-1">{it.name} × {it.quantity} ({it.tier})</span>
                ))}
              </div>
              {o.shipping?.city && <p className="mt-2 text-xs font-medium text-[#09090B]/50">Ship to: {o.shipping.name}, {o.shipping.city} — {o.shipping.pincode}</p>}
            </div>
          ))}
        </div>
      )}

      {tab === "boxes" && (
        <div className="space-y-8" data-testid="admin-boxes">
          <form onSubmit={addBox} className="brutal-lg rounded-2xl bg-[#8A2BE2] text-white p-6" data-testid="add-box-form">
            <h2 className="font-display font-black text-2xl flex items-center gap-2 mb-4"><Plus size={24} weight="bold" /> Add a new box</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <input required placeholder="Slug (e.g. sneaker)" value={newBox.slug} onChange={(e) => setNewBox({ ...newBox, slug: e.target.value })} className="brutal-sm rounded-lg px-3 py-2.5 text-[#09090B] font-medium outline-none" data-testid="new-slug" />
              <input required placeholder="Name" value={newBox.name} onChange={(e) => setNewBox({ ...newBox, name: e.target.value })} className="brutal-sm rounded-lg px-3 py-2.5 text-[#09090B] font-medium outline-none" data-testid="new-name" />
              <input placeholder="Phosphor icon (e.g. Sneaker)" value={newBox.emoji} onChange={(e) => setNewBox({ ...newBox, emoji: e.target.value })} className="brutal-sm rounded-lg px-3 py-2.5 text-[#09090B] font-medium outline-none" data-testid="new-emoji" />
              <input placeholder="Tagline" value={newBox.tagline} onChange={(e) => setNewBox({ ...newBox, tagline: e.target.value })} className="brutal-sm rounded-lg px-3 py-2.5 text-[#09090B] font-medium outline-none sm:col-span-2 lg:col-span-1" data-testid="new-tagline" />
              <input placeholder="Image URL" value={newBox.image} onChange={(e) => setNewBox({ ...newBox, image: e.target.value })} className="brutal-sm rounded-lg px-3 py-2.5 text-[#09090B] font-medium outline-none lg:col-span-2" data-testid="new-image" />
              <input placeholder="Color hex (#FFEA00)" value={newBox.color} onChange={(e) => setNewBox({ ...newBox, color: e.target.value })} className="brutal-sm rounded-lg px-3 py-2.5 text-[#09090B] font-medium outline-none" data-testid="new-color" />
              {["starter", "premium", "mega"].map((t) => (
                <input key={t} type="number" placeholder={`${t} ₹`} value={newBox.prices[t]} onChange={(e) => setNewBox({ ...newBox, prices: { ...newBox.prices, [t]: e.target.value } })} className="brutal-sm rounded-lg px-3 py-2.5 text-[#09090B] font-medium outline-none" data-testid={`new-price-${t}`} />
              ))}
            </div>
            <textarea placeholder="Description" value={newBox.description} onChange={(e) => setNewBox({ ...newBox, description: e.target.value })} className="mt-3 w-full brutal-sm rounded-lg px-3 py-2.5 text-[#09090B] font-medium outline-none" rows={2} data-testid="new-description" />
            <button type="submit" disabled={adding} className="mt-4 bg-[#FFEA00] text-[#09090B] brutal rounded-full px-6 py-3 font-bold uppercase press" data-testid="add-box-btn">
              {adding ? "Adding…" : "Create Box"}
            </button>
          </form>

          <div className="space-y-3">
            {boxes.map((b) => (
              <BoxRow key={b.slug} box={b} onSaved={load} onDeleted={load} />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
