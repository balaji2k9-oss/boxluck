import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import Marquee from "react-fast-marquee";
import * as Phosphor from "@phosphor-icons/react";
import { ArrowRight, Sparkle, Fire, Star } from "@phosphor-icons/react";
import { api } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";

const EASE = [0.76, 0, 0.24, 1];

const LineReveal = ({ children, delay = 0 }) => (
  <span className="reveal-line">
    <motion.span
      className="block"
      initial={{ y: "110%" }}
      animate={{ y: "0%" }}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      {children}
    </motion.span>
  </span>
);

const FadeUp = ({ children, delay = 0, className = "" }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.6, ease: EASE, delay }}
  >
    {children}
  </motion.div>
);

const PRICE = { starter: 299, premium: 599, mega: 999 };

const Hero = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yImg = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-[#FFEA00] border-b-[3px] border-[#09090B]"
      onMouseMove={(e) => {
        const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
        setTilt({ x: (e.clientX - cx) / 40, y: (e.clientY - cy) / 40 });
      }}
      data-testid="hero"
    >
      <div className="max-w-[1400px] mx-auto px-5 md:px-10 pt-16 md:pt-24 pb-20 grid lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-[#09090B] text-[#FFEA00] rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest mb-6"
          >
            <Fire size={16} weight="fill" /> First 100 orders get a bonus gift
          </motion.div>

          <h1 className="font-display font-black tracking-tighter text-[15vw] lg:text-[8.5vw] leading-[0.85]">
            <LineReveal delay={0.05}>EVERY BOX.</LineReveal>
            <LineReveal delay={0.18}>
              <span className="text-[#FF007F]">A NEW</span>
            </LineReveal>
            <LineReveal delay={0.31}>SURPRISE.</LineReveal>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="mt-6 text-lg md:text-xl font-medium max-w-md"
          >
            Affordable mystery boxes packed with products worth up to <b>2× the price</b>. Nobody knows what's inside — until you open it.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.5 }}
            className="mt-8 flex flex-wrap gap-4"
          >
            <a href="#boxes" className="bg-[#FF007F] text-white brutal rounded-full px-8 py-4 font-bold uppercase tracking-wide press flex items-center gap-2" data-testid="hero-shop-btn">
              Shop Boxes <ArrowRight size={20} weight="bold" />
            </a>
            <a href="#subscribe" className="bg-white brutal rounded-full px-8 py-4 font-bold uppercase tracking-wide press" data-testid="hero-subscribe-btn">
              Subscribe Monthly
            </a>
          </motion.div>
        </div>

        <div className="lg:col-span-5 relative">
          <motion.div style={{ y: yImg }} className="relative">
            <motion.div
              animate={{ x: tilt.x, y: tilt.y }}
              transition={{ type: "spring", stiffness: 60, damping: 12 }}
              className="relative brutal-lg rounded-2xl overflow-hidden bg-white rotate-2"
            >
              <img
                src="https://images.unsplash.com/photo-1573376671258-62ee7b68c853?crop=entropy&cs=srgb&fm=jpg&q=85&w=900"
                alt="Mystery box"
                className="w-full h-[360px] md:h-[460px] object-cover"
              />
            </motion.div>
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: -8 }}
              transition={{ delay: 0.9, type: "spring" }}
              className="absolute -top-5 -left-5 bg-[#00F0FF] brutal rounded-full w-24 h-24 grid place-items-center text-center font-display font-black leading-none rotate-[-8deg]"
            >
              <span>FROM<br />₹299</span>
            </motion.div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.05, type: "spring" }}
              className="absolute -bottom-5 -right-3 bg-[#39FF14] brutal rounded-2xl px-4 py-3 font-bold text-sm rotate-3 flex items-center gap-1"
            >
              <Sparkle size={18} weight="fill" /> Worth up to 2×
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const StripMarquee = () => (
  <div className="bg-[#09090B] text-[#FFEA00] py-3 border-b-[3px] border-[#09090B]">
    <Marquee autoFill speed={45}>
      {["GAMER", "TECH", "GIFT", "BEAUTY", "SNACK", "KIDS", "ANIME"].map((t, i) => (
        <span key={i} className="font-display font-black text-xl mx-6 flex items-center gap-6">
          {t} <Star size={16} weight="fill" className="text-[#FF007F]" />
        </span>
      ))}
    </Marquee>
  </div>
);

const spanMap = ["lg:col-span-7", "lg:col-span-5", "lg:col-span-5", "lg:col-span-7", "lg:col-span-4", "lg:col-span-4", "lg:col-span-4"];

const Categories = ({ boxes }) => (
  <section id="boxes" className="max-w-[1400px] mx-auto px-5 md:px-10 py-24" data-testid="categories">
    <FadeUp>
      <p className="text-sm tracking-[0.2em] uppercase font-bold text-[#8A2BE2]">Pick your fandom</p>
      <h2 className="font-display font-black text-5xl md:text-7xl tracking-tighter mt-2">7 BOXES. ∞ SURPRISES.</h2>
    </FadeUp>
    <div className="grid lg:grid-cols-12 gap-6 mt-12">
      {boxes.map((b, i) => {
        const Icon = Phosphor[b.emoji] || Phosphor.Gift;
        return (
          <FadeUp key={b.slug} delay={(i % 3) * 0.08} className={spanMap[i % spanMap.length]}>
            <Link
              to={`/box/${b.slug}`}
              className="group block h-full brutal rounded-2xl overflow-hidden bg-white press"
              style={{ background: b.color }}
              data-testid={`box-card-${b.slug}`}
            >
              <div className="p-6 flex items-center justify-between">
                <div className="w-12 h-12 grid place-items-center bg-white brutal-sm rounded-full">
                  <Icon size={24} weight="bold" />
                </div>
                <span className="bg-[#09090B] text-white text-xs font-bold px-3 py-1 rounded-full uppercase">From ₹299</span>
              </div>
              <div className="px-6 pb-4">
                <h3 className="font-display font-black text-2xl md:text-3xl tracking-tight leading-none">{b.name}</h3>
                <p className="mt-2 font-medium text-sm text-[#09090B]/80">{b.tagline}</p>
              </div>
              <div className="mx-4 mb-4 rounded-xl overflow-hidden brutal-sm">
                <img src={b.image} alt={b.name} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
            </Link>
          </FadeUp>
        );
      })}
    </div>
  </section>
);

const Pricing = () => {
  const nav = useNavigate();
  const tiers = [
    { key: "starter", name: "Starter Box", price: 299, color: "#00F0FF", perks: ["3–4 surprise items", "Worth up to 2×", "Perfect first try"] },
    { key: "premium", name: "Premium Box", price: 599, color: "#FFEA00", perks: ["5–7 premium items", "Worth up to 2×", "Golden Box entry", "Best value"], featured: true },
    { key: "mega", name: "Mega Box", price: 999, color: "#FF007F", perks: ["8+ high-value items", "Worth up to 2×", "2× Golden entries", "Guaranteed hero item"] },
  ];
  return (
    <section id="pricing" className="bg-[#09090B] text-white py-24 border-y-[3px] border-[#09090B]" data-testid="pricing">
      <div className="max-w-[1400px] mx-auto px-5 md:px-10">
        <FadeUp>
          <p className="text-sm tracking-[0.2em] uppercase font-bold text-[#39FF14]">Three ways to play</p>
          <h2 className="font-display font-black text-5xl md:text-7xl tracking-tighter mt-2">PICK A TIER.</h2>
        </FadeUp>
        <div className="grid md:grid-cols-3 gap-6 mt-12 items-center">
          {tiers.map((t, i) => (
            <FadeUp key={t.key} delay={i * 0.1}>
              <div
                className={`rounded-2xl p-8 text-[#09090B] brutal-lg ${t.featured ? "md:scale-105 md:-translate-y-2" : ""}`}
                style={{ background: t.color }}
                data-testid={`pricing-${t.key}`}
              >
                {t.featured && <span className="inline-block bg-[#09090B] text-[#FFEA00] text-xs font-bold px-3 py-1 rounded-full uppercase mb-3">Most Popular</span>}
                <h3 className="font-display font-black text-3xl tracking-tight">{t.name}</h3>
                <div className="font-display font-black text-6xl tracking-tighter mt-2">₹{t.price}</div>
                <ul className="mt-6 space-y-2 font-medium">
                  {t.perks.map((p) => (
                    <li key={p} className="flex items-center gap-2"><Sparkle size={16} weight="fill" /> {p}</li>
                  ))}
                </ul>
                <button
                  onClick={() => nav("/#boxes") || (window.location.href = "/#boxes")}
                  className="mt-8 w-full bg-white brutal rounded-full py-3.5 font-bold uppercase tracking-wide press"
                  data-testid={`pricing-cta-${t.key}`}
                >
                  Choose {t.name}
                </button>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
};

const Manifesto = () => {
  const steps = [
    { n: "01", t: "Pick your box", d: "Choose a category and a tier from ₹299 to ₹999. Snack, tech, anime — your call.", c: "#FF007F" },
    { n: "02", t: "We pack the surprise", d: "Our team curates items worth up to 2× the price. Even we shuffle the mix.", c: "#8A2BE2" },
    { n: "03", t: "Open. Film. Share.", d: "Unbox on camera, tag #MysteryBoxIN, and you could win the weekly Golden Box.", c: "#00F0FF" },
  ];
  return (
    <section className="max-w-[1400px] mx-auto px-5 md:px-10 py-24" data-testid="manifesto">
      <FadeUp>
        <p className="text-sm tracking-[0.2em] uppercase font-bold text-[#FF007F]">The ritual</p>
        <h2 className="font-display font-black text-5xl md:text-7xl tracking-tighter mt-2">HOW IT WORKS</h2>
      </FadeUp>
      <div className="mt-12 space-y-6">
        {steps.map((s, i) => (
          <FadeUp key={s.n} delay={i * 0.08}>
            <div className="grid md:grid-cols-12 gap-4 items-center border-b-2 border-[#09090B] pb-6">
              <div className="md:col-span-3 font-display font-black text-7xl md:text-8xl tracking-tighter" style={{ color: s.c }}>{s.n}</div>
              <h3 className="md:col-span-4 font-display font-black text-3xl tracking-tight">{s.t}</h3>
              <p className="md:col-span-5 text-lg font-medium text-[#09090B]/70">{s.d}</p>
            </div>
          </FadeUp>
        ))}
      </div>
    </section>
  );
};

const Subscribe = () => {
  const nav = useNavigate();
  return (
    <section id="subscribe" className="max-w-[1400px] mx-auto px-5 md:px-10 pb-24" data-testid="subscribe">
      <div className="brutal-lg rounded-2xl bg-[#8A2BE2] text-white p-8 md:p-14 grid md:grid-cols-2 gap-8 items-center">
        <div>
          <p className="text-sm tracking-[0.2em] uppercase font-bold text-[#FFEA00]">Never miss a drop</p>
          <h2 className="font-display font-black text-4xl md:text-6xl tracking-tighter mt-2">MONTHLY MYSTERY, ON REPEAT.</h2>
          <p className="mt-4 text-lg font-medium text-white/80 max-w-md">A fresh surprise box at your door every month. Pause or cancel anytime. Subscribers get first dibs on limited seasonal boxes.</p>
        </div>
        <div className="grid gap-4">
          {[{ k: "starter", p: 299 }, { k: "premium", p: 599 }, { k: "mega", p: 999 }].map((s) => (
            <button
              key={s.k}
              onClick={() => nav(`/checkout?sub=${s.k}`)}
              className="flex items-center justify-between bg-white text-[#09090B] brutal rounded-2xl px-6 py-4 press"
              data-testid={`subscribe-${s.k}`}
            >
              <span className="font-display font-black text-2xl capitalize">{s.k} Monthly</span>
              <span className="font-bold">₹{s.p}/mo <ArrowRight size={18} weight="bold" className="inline" /></span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

const GoldenBox = () => {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const target = new Date();
    target.setDate(target.getDate() + (7 - target.getDay()));
    target.setHours(23, 59, 59, 0);
    const tick = () => {
      const diff = Math.max(0, target - new Date());
      setTime({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff / 3600000) % 24),
        m: Math.floor((diff / 60000) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <section id="golden" className="bg-[#09090B] text-white py-24 border-y-[3px] border-[#FFEA00]" data-testid="golden-box">
      <div className="max-w-[1400px] mx-auto px-5 md:px-10 grid md:grid-cols-2 gap-12 items-center">
        <FadeUp>
          <div className="inline-flex items-center gap-2 bg-[#FFEA00] text-[#09090B] rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest mb-6">
            <Fire size={16} weight="fill" /> This week's grand prize
          </div>
          <h2 className="font-display font-black text-5xl md:text-7xl tracking-tighter leading-[0.9]">
            THE <span className="text-[#FFEA00]">GOLDEN</span> BOX
          </h2>
          <p className="mt-5 text-lg font-medium text-white/70 max-w-md">
            One lucky order every week contains a premium grand-prize surprise. Premium & Mega buyers get automatic entries. Could yours be golden?
          </p>
          <div className="mt-8 flex gap-3">
            {[["DAYS", time.d], ["HRS", time.h], ["MIN", time.m], ["SEC", time.s]].map(([l, v]) => (
              <div key={l} className="bg-[#FFEA00] text-[#09090B] brutal rounded-xl w-20 py-3 text-center">
                <div className="font-display font-black text-3xl tabular-nums">{String(v).padStart(2, "0")}</div>
                <div className="text-[10px] font-bold tracking-widest">{l}</div>
              </div>
            ))}
          </div>
        </FadeUp>
        <FadeUp delay={0.15}>
          <div className="brutal-lg rounded-2xl overflow-hidden rotate-2">
            <img src="https://images.unsplash.com/photo-1674620213535-9b2a2553ef40?crop=entropy&cs=srgb&fm=jpg&q=85&w=900" alt="Golden box" className="w-full h-[420px] object-cover" />
          </div>
        </FadeUp>
      </div>
    </section>
  );
};

const UGC = () => (
  <section className="max-w-[1400px] mx-auto px-5 md:px-10 py-24" data-testid="ugc">
    <FadeUp>
      <p className="text-sm tracking-[0.2em] uppercase font-bold text-[#8A2BE2]">Straight from the fans</p>
      <h2 className="font-display font-black text-5xl md:text-7xl tracking-tighter mt-2">"I SPENT ₹299 AND FOUND THIS 🤯"</h2>
    </FadeUp>
    <div className="grid md:grid-cols-3 gap-6 mt-12">
      {[
        { img: "https://images.unsplash.com/photo-1608573773585-199ff9a61c09?crop=entropy&cs=srgb&fm=jpg&q=85&w=800", name: "@ananya.reels", quote: "Best ₹599 I've spent. The unboxing broke my Reels record." },
        { img: "https://images.unsplash.com/photo-1607083206968-13611e3d76db?crop=entropy&cs=srgb&fm=jpg&q=85&w=800", name: "@techwith_rohan", quote: "Got earbuds worth ₹1200 in a ₹599 box. Insane value." },
        { img: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?crop=entropy&cs=srgb&fm=jpg&q=85&w=800", name: "@snack_squad", quote: "The snack box is a whole flavour trip. Ordering monthly now." },
      ].map((u, i) => (
        <FadeUp key={i} delay={i * 0.08}>
          <div className="brutal rounded-2xl overflow-hidden bg-white press h-full">
            <img src={u.img} alt={u.name} className="w-full h-56 object-cover" />
            <div className="p-5">
              <p className="font-medium">"{u.quote}"</p>
              <p className="mt-3 font-bold text-[#FF007F]">{u.name}</p>
            </div>
          </div>
        </FadeUp>
      ))}
    </div>
  </section>
);

export default function Home() {
  const [boxes, setBoxes] = useState([]);
  useEffect(() => {
    api.get("/boxes").then((r) => setBoxes(r.data)).catch(() => toast.error("Could not load boxes"));
  }, []);
  return (
    <main>
      <Hero />
      <StripMarquee />
      <Categories boxes={boxes} />
      <Pricing />
      <Manifesto />
      <Subscribe />
      <GoldenBox />
      <UGC />
    </main>
  );
}
