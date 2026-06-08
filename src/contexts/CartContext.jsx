import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "ajfitness_cart_v1";

const CartContext = createContext(null);

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x) =>
        x &&
        typeof x.variantId === "number" &&
        typeof x.quantity === "number" &&
        x.quantity > 0,
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [lines, setLines] = useState(() =>
    typeof window !== "undefined" ? loadStored() : [],
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // ignore
    }
  }, [lines]);

  const addLine = useCallback((payload) => {
    const qty = Math.min(99, Math.max(1, Number(payload.quantity) || 1));
    setLines((prev) => {
      const i = prev.findIndex((l) => l.variantId === payload.variantId);
      if (i >= 0) {
        const next = [...prev];
        next[i] = {
          ...next[i],
          quantity: Math.min(99, next[i].quantity + qty),
        };
        return next;
      }
      return [
        ...prev,
        {
          variantId: payload.variantId,
          quantity: qty,
          productName: payload.productName,
          variantLabel: payload.variantLabel,
          unitPrice: payload.unitPrice,
          slug: payload.slug,
          imageUrl: payload.imageUrl ?? null,
        },
      ];
    });
  }, []);

  const setQuantity = useCallback((variantId, quantity) => {
    const q = Math.min(99, Math.max(0, Number(quantity) || 0));
    setLines((prev) => {
      if (q <= 0) return prev.filter((l) => l.variantId !== variantId);
      return prev.map((l) =>
        l.variantId === variantId ? { ...l, quantity: q } : l,
      );
    });
  }, []);

  const removeLine = useCallback((variantId) => {
    setLines((prev) => prev.filter((l) => l.variantId !== variantId));
  }, []);

  const clearCart = useCallback(() => setLines([]), []);

  const totals = useMemo(() => {
    let subtotal = 0;
    let count = 0;
    for (const l of lines) {
      subtotal += l.unitPrice * l.quantity;
      count += l.quantity;
    }
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      itemCount: count,
      lineCount: lines.length,
    };
  }, [lines]);

  const value = useMemo(
    () => ({
      lines,
      addLine,
      setQuantity,
      removeLine,
      clearCart,
      ...totals,
    }),
    [lines, addLine, setQuantity, removeLine, clearCart, totals],
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
