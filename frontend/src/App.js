import { useEffect } from "react";
import "@/App.css";
import "@/index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ReactLenis } from "lenis/react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import Home from "@/pages/Home";
import BoxDetail from "@/pages/BoxDetail";
import CartPage from "@/pages/CartPage";
import Checkout from "@/pages/Checkout";
import Auth from "@/pages/Auth";
import Account from "@/pages/Account";
import PaymentResult from "@/pages/PaymentResult";

function App() {
  useEffect(() => {
    document.title = "Mystery Box India — Every Box. A New Surprise.";
  }, []);
  return (
    <div className="App grain">
      <ReactLenis root options={{ lerp: 0.08, smoothWheel: true }}>
        <AuthProvider>
          <CartProvider>
            <BrowserRouter>
              <Nav />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/box/:slug" element={<BoxDetail />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/login" element={<Auth mode="login" />} />
                <Route path="/register" element={<Auth mode="register" />} />
                <Route path="/account" element={<Account />} />
                <Route path="/payment/success" element={<PaymentResult />} />
                <Route path="/payment/cancel" element={<PaymentResult cancelled />} />
              </Routes>
              <Footer />
            </BrowserRouter>
            <Toaster position="top-center" richColors />
          </CartProvider>
        </AuthProvider>
      </ReactLenis>
    </div>
  );
}

export default App;
