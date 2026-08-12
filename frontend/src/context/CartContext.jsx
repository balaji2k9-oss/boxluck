import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

const TIER_PRICES = { starter: 299, premium: 599, mega: 999 };

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("mb_cart") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("mb_cart", JSON.stringify(items));
  }, [items]);

  const addItem = (box, tier) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.box_id === box.slug && i.tier === tier);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + 1 };
        return copy;
      }
      return [
        ...prev,
        { box_id: box.slug, name: box.name, tier, quantity: 1, image: box.image, color: box.color },
      ];
    });
  };
  const updateQty = (box_id, tier, delta) =>
    setItems((prev) =>
      prev
        .map((i) =>
          i.box_id === box_id && i.tier === tier
            ? { ...i, quantity: Math.max(0, i.quantity + delta) }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  const removeItem = (box_id, tier) =>
    setItems((prev) => prev.filter((i) => !(i.box_id === box_id && i.tier === tier)));
  const clear = () => setItems([]);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce((s, i) => s + TIER_PRICES[i.tier] * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, updateQty, removeItem, clear, count, total, TIER_PRICES }}
    >
      {children}
    </CartContext.Provider>
  );
}
