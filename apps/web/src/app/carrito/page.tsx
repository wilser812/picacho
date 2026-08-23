"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { api, type ApiOrder } from "@/lib/api";

export default function CartPage() {
  const router = useRouter();
  const { items, setQuantity, removeItem, clear, total } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkout() {
    if (!user) {
      router.push("/login");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const orders = await api.post<ApiOrder[]>("/orders", {
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });

      const checkouts = await Promise.all(
        orders.map((o) => api.post<{ checkoutUrl: string }>(`/payments/checkout/${o.id}`)),
      );

      clear();

      if (checkouts.length === 1) {
        window.location.href = checkouts[0].checkoutUrl;
      } else {
        router.push(`/pedidos`);
      }
    } catch {
      setError("No se pudo procesar el pedido. Intenta de nuevo.");
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen px-6 py-16 text-center">
        <p className="text-foreground/70">Tu carrito está vacío.</p>
        <Link href="/" className="mt-4 inline-block font-semibold text-accent">
          Ir al catálogo
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-bold text-foreground">Tu carrito</h1>

      <ul className="mt-6 flex flex-col gap-4">
        {items.map((item) => (
          <li
            key={item.productId}
            className="flex items-center justify-between rounded-xl border border-black/10 bg-white p-4"
          >
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-foreground/60">S/ {Number(item.price).toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) => setQuantity(item.productId, Number(e.target.value))}
                className="w-16 rounded-lg border border-black/10 px-2 py-1 text-center text-sm"
              />
              <button
                onClick={() => removeItem(item.productId)}
                className="text-sm text-foreground/50 hover:text-red-600"
              >
                Quitar
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between border-t border-black/10 pt-4">
        <span className="text-lg font-semibold">Total</span>
        <span className="text-lg font-bold text-primary">S/ {total.toFixed(2)}</span>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <button
        onClick={checkout}
        disabled={loading}
        className="mt-6 w-full rounded-lg bg-accent px-4 py-3 font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Procesando..." : "Proceder al pago"}
      </button>
    </main>
  );
}
