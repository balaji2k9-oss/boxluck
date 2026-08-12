import Marquee from "react-fast-marquee";

export const Footer = () => (
  <footer className="bg-[#09090B] text-white" data-testid="footer">
    <div className="border-y-[3px] border-[#FFEA00] py-4">
      <Marquee autoFill speed={40}>
        <span className="font-display font-black text-3xl md:text-5xl tracking-tighter mx-8 text-[#FFEA00]">
          EVERY BOX. A NEW SURPRISE.
        </span>
        <span className="font-display font-black text-3xl md:text-5xl tracking-tighter mx-8 text-white">
          OPEN IT. FILM IT. SHARE IT.
        </span>
      </Marquee>
    </div>
    <div className="max-w-[1400px] mx-auto px-5 md:px-10 py-16 grid md:grid-cols-4 gap-10">
      <div className="md:col-span-2">
        <div className="font-display font-black text-3xl tracking-tighter">
          MYSTERY<span className="text-[#FF007F]">BOX</span><span className="text-[#8A2BE2]">.IN</span>
        </div>
        <p className="mt-4 text-white/60 max-w-sm">
          India's most shareable mystery box. Products worth up to 2× the price. Nobody knows what's inside — until you do.
        </p>
      </div>
      <div>
        <h4 className="font-bold uppercase text-sm tracking-widest text-[#00F0FF] mb-4">Explore</h4>
        <ul className="space-y-2 text-white/70">
          <li><a href="/#boxes" className="hover:text-white">All Boxes</a></li>
          <li><a href="/#pricing" className="hover:text-white">Pricing</a></li>
          <li><a href="/#subscribe" className="hover:text-white">Subscriptions</a></li>
          <li><a href="/#golden" className="hover:text-white">Golden Box</a></li>
        </ul>
      </div>
      <div>
        <h4 className="font-bold uppercase text-sm tracking-widest text-[#39FF14] mb-4">Follow</h4>
        <ul className="space-y-2 text-white/70">
          <li>Instagram #MysteryBoxIN</li>
          <li>YouTube Shorts</li>
          <li>Facebook</li>
        </ul>
      </div>
    </div>
    <div className="border-t border-white/10 py-6 text-center text-white/40 text-sm">
      © 2026 Mystery Box India. Every box a new surprise.
    </div>
  </footer>
);
