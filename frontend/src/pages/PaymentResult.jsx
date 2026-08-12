import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Confetti } from "@phosphor-icons/react";
import { api } from "@/lib/api";
import { useCart } from "@/context/CartContext";

export default function PaymentResult({ cancelled }) {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { clear } = useCart();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState(cancelled ? "cancelled" : "checking");
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (cancelled || !sessionId) return;
    let active = true;
    const poll = async () => {
      if (attempts > 8) { if (active) setStatus("timeout"); return; }
      try {
        const { data } = await api.get(`/payments/status/${sessionId}`);
        if (!active) return;
        if (data.payment_status === "paid") { setStatus("paid"); clear(); return; }
        if (data.status === "expired" || data.payment_status === "failed") { setStatus("failed"); return; }
        setTimeout(() => setAttempts((a) => a + 1), 1800);
      } catch {
        if (active) setStatus("failed");
      }
    };
    poll();
    return () => { active = false; };
  }, [attempts, sessionId, cancelled]); // eslint-disable-line

  const cfg = {
    checking: { icon: <Confetti size={48} weight="fill" />, bg: "#FFEA00", title: "CONFIRMING PAYMENT…", sub: "Hang tight, verifying your order." },
    paid: { icon: <CheckCircle size={48} weight="fill" />, bg: "#39FF14", title: "PAYMENT SUCCESSFUL!", sub: "Your mystery box is on its way. Get ready to unbox 🎉" },
    failed: { icon: <XCircle size={48} weight="fill" />, bg: "#FF007F", title: "PAYMENT FAILED", sub: "Something went wrong. Please try again." },
    timeout: { icon: <Confetti size={48} weight="fill" />, bg: "#00F0FF", title: "STILL PROCESSING", sub: "Check your account shortly for order status." },
    cancelled: { icon: <XCircle size={48} weight="fill" />, bg: "#FF007F", title: "PAYMENT CANCELLED", sub: "No worries — your cart is saved." },
  }[status];

  return (
    <main className="min-h-[80vh] grid place-items-center px-5 py-12" data-testid="payment-result">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md brutal-lg rounded-2xl bg-white p-10 text-center">
        <div className="w-20 h-20 grid place-items-center brutal rounded-full mx-auto mb-6" style={{ background: cfg.bg }}>{cfg.icon}</div>
        <h1 className="font-display font-black text-4xl tracking-tighter" data-testid="payment-status-title">{cfg.title}</h1>
        <p className="font-medium text-[#09090B]/60 mt-3">{cfg.sub}</p>
        <div className="mt-8 flex flex-col gap-3">
          <Link to="/account" className="bg-[#09090B] text-white brutal rounded-full py-3.5 font-bold uppercase press" data-testid="go-account">My Orders</Link>
          <Link to="/#boxes" className="bg-white brutal rounded-full py-3.5 font-bold uppercase press">Keep Shopping</Link>
        </div>
      </motion.div>
    </main>
  );
}
