import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";

export default function Auth({ mode }) {
  const isLogin = mode === "login";
  const { login, register } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
      toast.success(isLogin ? "Welcome back!" : "Account created! 🎉");
      nav(next || "/account");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[80vh] grid place-items-center px-5 py-12" data-testid="auth-page">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md brutal-lg rounded-2xl bg-white p-8">
        <div className="font-display font-black text-lg tracking-tighter mb-6">MYSTERY<span className="text-[#FF007F]">BOX</span><span className="text-[#8A2BE2]">.IN</span></div>
        <h1 className="font-display font-black text-4xl tracking-tighter">{isLogin ? "WELCOME BACK" : "JOIN THE HYPE"}</h1>
        <p className="font-medium text-[#09090B]/60 mt-2">{isLogin ? "Log in to track your surprises." : "Create an account to start unboxing."}</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {!isLogin && (
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" className="w-full brutal-sm rounded-xl px-4 py-3 font-medium outline-none" data-testid="auth-name" />
          )}
          <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="w-full brutal-sm rounded-xl px-4 py-3 font-medium outline-none" data-testid="auth-email" />
          <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password (min 6 chars)" className="w-full brutal-sm rounded-xl px-4 py-3 font-medium outline-none" data-testid="auth-password" />
          <button type="submit" disabled={loading} className="w-full bg-[#FF007F] text-white brutal rounded-full py-4 font-bold uppercase press disabled:opacity-60" data-testid="auth-submit">
            {loading ? "Please wait…" : isLogin ? "Log In" : "Create Account"}
          </button>
        </form>
        <p className="mt-6 text-center font-medium">
          {isLogin ? "New here? " : "Already have an account? "}
          <Link to={isLogin ? "/register" : "/login"} className="font-bold text-[#8A2BE2] underline" data-testid="auth-switch">
            {isLogin ? "Create account" : "Log in"}
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
