"use client";

import { formatPrice, type ApiProduct } from "@/lib/api";
import { useCart } from "@/context/CartContext";

export function ProductGrid({ products }: { products: ApiProduct[] }) {
  const { addItem } = useCart();

  if (products.length === 0) {
    return <p className="mt-4 text-foreground/60">No se encontraron productos.</p>;
  }

  return (
    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {products.map((p) => (
        <div key={p.id} className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-xs text-foreground/50">{p.category.name}</p>
          <p className="mt-1 font-medium">{p.name}</p>
          <p className="mt-1 font-semibold text-primary">{formatPrice(p.price, p.unit)}</p>
          <button
            onClick={() => addItem(p)}
            className="mt-3 w-full rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white"
          >
            Agregar al carrito
          </button>
        </div>
      ))}
    </div>
  );
}
