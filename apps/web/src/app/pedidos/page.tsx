"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api, type ApiOrder } from "@/lib/api";

const STATUS_LABEL: Record<ApiOrder["status"], string> = {
  RECEIVED: "Recibido",
  PREPARING: "En preparación",
  ON_THE_WAY: "En camino",
  DELIVERED: "Entregado",
};

export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    api
      .get<ApiOrder[]>("/orders")
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <main className="min-h-screen px-6 py-16 text-center text-foreground/60">Cargando...</main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-bold text-foreground">Mis pedidos</h1>

      {orders.length === 0 ? (
        <p className="mt-4 text-foreground/60">Todavía no tienes pedidos.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/pedido/${order.id}`}
                className="flex items-center justify-between rounded-xl border border-black/10 bg-white p-4"
              >
                <div>
                  <p className="font-medium">{order.vendor.storeName}</p>
                  <p className="text-sm text-foreground/60">
                    {STATUS_LABEL[order.status]} · {order.items.length} producto(s)
                  </p>
                </div>
                <span className="font-semibold text-primary">S/ {Number(order.total).toFixed(2)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
