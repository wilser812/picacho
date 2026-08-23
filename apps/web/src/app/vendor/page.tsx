"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { picachoCategoryTree } from "@picacho/shared";
import { useAuth } from "@/context/AuthContext";
import {
  api,
  formatPrice,
  type ApiVendor,
  type ApiVendorProduct,
  type ApiVendorOrder,
} from "@/lib/api";

const STATUS_LABEL: Record<ApiVendorOrder["status"], string> = {
  RECEIVED: "Recibido",
  PREPARING: "En preparación",
  ON_THE_WAY: "En camino",
  DELIVERED: "Entregado",
};

const SUBCATEGORIES = picachoCategoryTree.flatMap((main) =>
  main.subcategories.length > 0
    ? main.subcategories.map((sub) => ({ slug: sub.slug, label: `${main.name} · ${sub.name}` }))
    : [{ slug: main.slug, label: main.name }],
);

export default function VendorDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [vendor, setVendor] = useState<ApiVendor | null>(null);
  const [tab, setTab] = useState<"productos" | "pedidos">("productos");
  const [products, setProducts] = useState<ApiVendorProduct[]>([]);
  const [orders, setOrders] = useState<ApiVendorOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "VENDOR") {
      router.push("/vendor/registro");
      return;
    }

    Promise.all([
      api.get<ApiVendor>("/vendor/me"),
      api.get<ApiVendorProduct[]>("/vendor/products"),
      api.get<ApiVendorOrder[]>("/vendor/orders"),
    ])
      .then(([v, p, o]) => {
        setVendor(v);
        setProducts(p);
        setOrders(o);
      })
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  async function refreshProducts() {
    setProducts(await api.get<ApiVendorProduct[]>("/vendor/products"));
  }

  async function markPreparing(orderId: string) {
    await api.patch(`/vendor/orders/${orderId}/status`, { status: "PREPARING" });
    setOrders(await api.get<ApiVendorOrder[]>("/vendor/orders"));
  }

  async function deleteProduct(id: string) {
    await api.delete<void>(`/vendor/products/${id}`);
    await refreshProducts();
  }

  if (authLoading || loading) {
    return <main className="min-h-screen px-6 py-16 text-center text-foreground/60">Cargando...</main>;
  }

  if (!vendor) return null;

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold text-foreground">{vendor.storeName}</h1>
      <p className="mt-1 text-sm text-foreground/60">
        {vendor.isApproved ? (
          <span className="text-primary">Tienda aprobada y visible en el catálogo.</span>
        ) : (
          <span className="text-accent">
            Pendiente de aprobación por un administrador. Mientras tanto puedes ir cargando tus
            productos.
          </span>
        )}
      </p>

      <div className="mt-6 flex gap-4 border-b border-black/10">
        <button
          onClick={() => setTab("productos")}
          className={`pb-2 text-sm font-semibold ${tab === "productos" ? "border-b-2 border-primary text-primary" : "text-foreground/50"}`}
        >
          Productos ({products.length})
        </button>
        <button
          onClick={() => setTab("pedidos")}
          className={`pb-2 text-sm font-semibold ${tab === "pedidos" ? "border-b-2 border-primary text-primary" : "text-foreground/50"}`}
        >
          Pedidos ({orders.length})
        </button>
      </div>

      {tab === "productos" ? (
        <ProductsTab products={products} onCreated={refreshProducts} onDelete={deleteProduct} />
      ) : (
        <OrdersTab orders={orders} onMarkPreparing={markPreparing} />
      )}
    </main>
  );
}

function ProductsTab({
  products,
  onCreated,
  onDelete,
}: {
  products: ApiVendorProduct[];
  onCreated: () => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState<"KG" | "UNIT" | "LITER">("UNIT");
  const [categorySlug, setCategorySlug] = useState(SUBCATEGORIES[0]?.slug ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.post("/vendor/products", { name, price: Number(price), unit, categorySlug });
      setName("");
      setPrice("");
      await onCreated();
    } catch {
      setError("No se pudo crear el producto.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-xl border border-black/10 bg-white p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-foreground/60">Nombre</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            className="rounded-lg border border-black/10 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-foreground/60">Precio (S/)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className="w-28 rounded-lg border border-black/10 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-foreground/60">Unidad</label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as typeof unit)}
            className="rounded-lg border border-black/10 px-3 py-2 text-sm"
          >
            <option value="UNIT">Unidad</option>
            <option value="KG">Kg</option>
            <option value="LITER">Litro</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-foreground/60">Categoría</label>
          <select
            value={categorySlug}
            onChange={(e) => setCategorySlug(e.target.value)}
            className="rounded-lg border border-black/10 px-3 py-2 text-sm"
          >
            {SUBCATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Agregar producto"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <ul className="mt-4 flex flex-col gap-3">
        {products.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between rounded-xl border border-black/10 bg-white p-4"
          >
            <div>
              <p className="font-medium">{p.name}</p>
              <p className="text-sm text-foreground/60">
                {p.category.name} · {formatPrice(p.price, p.unit)}
              </p>
            </div>
            <button
              onClick={() => onDelete(p.id)}
              className="text-sm text-foreground/50 hover:text-red-600"
            >
              Eliminar
            </button>
          </li>
        ))}
        {products.length === 0 && (
          <p className="text-sm text-foreground/60">Todavía no tienes productos.</p>
        )}
      </ul>
    </div>
  );
}

function OrdersTab({
  orders,
  onMarkPreparing,
}: {
  orders: ApiVendorOrder[];
  onMarkPreparing: (id: string) => Promise<void>;
}) {
  return (
    <ul className="mt-6 flex flex-col gap-3">
      {orders.map((order) => (
        <li key={order.id} className="rounded-xl border border-black/10 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{order.buyer.name}</p>
              <p className="text-sm text-foreground/60">
                {STATUS_LABEL[order.status]} · {order.items.length} producto(s) · S/{" "}
                {Number(order.total).toFixed(2)}
              </p>
            </div>
            {order.status === "RECEIVED" && (
              <button
                onClick={() => onMarkPreparing(order.id)}
                className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white"
              >
                Marcar en preparación
              </button>
            )}
          </div>
        </li>
      ))}
      {orders.length === 0 && <p className="text-sm text-foreground/60">Todavía no tienes pedidos.</p>}
    </ul>
  );
}
