"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  api,
  type ApiAdminDriver,
  type ApiAdminOrder,
  type ApiAdminProduct,
  type ApiAdminUser,
  type ApiAdminVendor,
  type ApiPlatformSettings,
} from "@/lib/api";

const STATUS_LABEL: Record<ApiAdminOrder["status"], string> = {
  RECEIVED: "Recibido",
  PREPARING: "En preparación",
  ON_THE_WAY: "En camino",
  DELIVERED: "Entregado",
};

const TABS = ["Vendedores", "Productos", "Pedidos", "Usuarios", "Comisión"] as const;
type Tab = (typeof TABS)[number];

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("Vendedores");
  const [loading, setLoading] = useState(true);

  const [vendors, setVendors] = useState<ApiAdminVendor[]>([]);
  const [products, setProducts] = useState<ApiAdminProduct[]>([]);
  const [orders, setOrders] = useState<ApiAdminOrder[]>([]);
  const [users, setUsers] = useState<ApiAdminUser[]>([]);
  const [drivers, setDrivers] = useState<ApiAdminDriver[]>([]);
  const [settings, setSettings] = useState<ApiPlatformSettings | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "ADMIN") {
      router.push("/");
      return;
    }
    refreshAll();
  }, [user, authLoading, router]);

  async function refreshAll() {
    const [v, p, o, u, d, s] = await Promise.all([
      api.get<ApiAdminVendor[]>("/admin/vendors"),
      api.get<ApiAdminProduct[]>("/admin/products"),
      api.get<ApiAdminOrder[]>("/admin/orders"),
      api.get<ApiAdminUser[]>("/admin/users"),
      api.get<ApiAdminDriver[]>("/admin/drivers"),
      api.get<ApiPlatformSettings>("/admin/settings"),
    ]);
    setVendors(v);
    setProducts(p);
    setOrders(o);
    setUsers(u);
    setDrivers(d);
    setSettings(s);
    setLoading(false);
  }

  async function assignDriver(orderId: string, driverId: string) {
    if (!driverId) return;
    await api.patch(`/admin/orders/${orderId}/assign-driver`, { driverId });
    setOrders(await api.get<ApiAdminOrder[]>("/admin/orders"));
  }

  async function toggleVendorApproval(id: string, isApproved: boolean) {
    await api.patch(`/admin/vendors/${id}/approval`, { isApproved: !isApproved });
    setVendors(await api.get<ApiAdminVendor[]>("/admin/vendors"));
  }

  async function deleteProduct(id: string) {
    await api.delete(`/admin/products/${id}`);
    setProducts(await api.get<ApiAdminProduct[]>("/admin/products"));
  }

  if (authLoading || loading) {
    return <main className="min-h-screen px-6 py-16 text-center text-foreground/60">Cargando...</main>;
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-bold text-foreground">Panel de administración</h1>

      <div className="mt-6 flex flex-wrap gap-4 border-b border-black/10">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 text-sm font-semibold ${tab === t ? "border-b-2 border-primary text-primary" : "text-foreground/50"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Vendedores" && (
        <ul className="mt-6 flex flex-col gap-3">
          {vendors.map((v) => (
            <li
              key={v.id}
              className="flex items-center justify-between rounded-xl border border-black/10 bg-white p-4"
            >
              <div>
                <p className="font-medium">{v.storeName}</p>
                <p className="text-sm text-foreground/60">
                  {v.user.name} · {v.user.email} · {v._count.products} producto(s)
                </p>
              </div>
              <button
                onClick={() => toggleVendorApproval(v.id, v.isApproved)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold text-white ${v.isApproved ? "bg-foreground/40" : "bg-primary"}`}
              >
                {v.isApproved ? "Revocar aprobación" : "Aprobar"}
              </button>
            </li>
          ))}
        </ul>
      )}

      {tab === "Productos" && (
        <ul className="mt-6 flex flex-col gap-3">
          {products.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-black/10 bg-white p-4"
            >
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-foreground/60">
                  {p.vendor.storeName} · {p.category.name} · S/ {Number(p.price).toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => deleteProduct(p.id)}
                className="text-sm text-foreground/50 hover:text-red-600"
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}

      {tab === "Pedidos" && (
        <ul className="mt-6 flex flex-col gap-3">
          {orders.map((o) => (
            <li key={o.id} className="rounded-xl border border-black/10 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {o.buyer.name} → {o.vendor.storeName}
                  </p>
                  <p className="text-sm text-foreground/60">
                    {STATUS_LABEL[o.status]}
                    {o.driver ? ` · repartidor: ${o.driver.user.name}` : " · sin repartidor"} · S/{" "}
                    {Number(o.total).toFixed(2)}
                    {o.payment ? ` · pago: ${o.payment.status}` : ""}
                  </p>
                </div>
                {o.status !== "DELIVERED" && (
                  <select
                    value={o.driver?.id ?? ""}
                    onChange={(e) => assignDriver(o.id, e.target.value)}
                    className="rounded-lg border border-black/10 px-3 py-2 text-sm"
                  >
                    <option value="" disabled>
                      Asignar repartidor
                    </option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.user.name} · {d.vehicleType}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {tab === "Usuarios" && (
        <ul className="mt-6 flex flex-col gap-3">
          {users.map((u) => (
            <li
              key={u.id}
              className="flex items-center justify-between rounded-xl border border-black/10 bg-white p-4"
            >
              <div>
                <p className="font-medium">{u.name}</p>
                <p className="text-sm text-foreground/60">{u.email}</p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {u.role}
              </span>
            </li>
          ))}
        </ul>
      )}

      {tab === "Comisión" && settings && (
        <CommissionForm
          settings={settings}
          onSaved={async () => setSettings(await api.get<ApiPlatformSettings>("/admin/settings"))}
        />
      )}
    </main>
  );
}

function CommissionForm({
  settings,
  onSaved,
}: {
  settings: ApiPlatformSettings;
  onSaved: () => Promise<void>;
}) {
  const [value, setValue] = useState(String(Number(settings.commissionRate) * 100));
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch("/admin/settings", { commissionRate: Number(value) / 100 });
      await onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex max-w-xs flex-col gap-3">
      <label className="text-sm text-foreground/70">Comisión de la plataforma (%)</label>
      <input
        type="number"
        step="0.1"
        min="0"
        max="100"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="rounded-lg border border-black/10 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Guardando..." : "Guardar"}
      </button>
    </form>
  );
}
