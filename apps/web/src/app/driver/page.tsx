"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api, type ApiDriver, type ApiDriverOrder } from "@/lib/api";
import { sendDriverLocation } from "@/lib/socket";

const STATUS_LABEL: Record<ApiDriverOrder["status"], string> = {
  RECEIVED: "Recibido",
  PREPARING: "En preparación",
  ON_THE_WAY: "En camino",
  DELIVERED: "Entregado",
};

export default function DriverDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [driver, setDriver] = useState<ApiDriver | null>(null);
  const [tab, setTab] = useState<"disponibles" | "mis-entregas">("disponibles");
  const [available, setAvailable] = useState<ApiDriverOrder[]>([]);
  const [mine, setMine] = useState<ApiDriverOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  // Guarda la lista de pedidos más reciente sin reiniciar el watchPosition cada
  // vez que cambia (aceptar/entregar un pedido no debe cortar el GPS activo).
  const mineRef = useRef<ApiDriverOrder[]>([]);

  useEffect(() => {
    mineRef.current = mine;
  }, [mine]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "DRIVER") {
      router.push("/");
      return;
    }

    Promise.all([
      api.get<ApiDriver>("/driver/me"),
      api.get<ApiDriverOrder[]>("/driver/orders/available"),
      api.get<ApiDriverOrder[]>("/driver/orders"),
    ])
      .then(([d, av, mn]) => {
        setDriver(d);
        setAvailable(av);
        setMine(mn);
      })
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  // Un solo watchPosition del navegador; cada vez que llega una posición nueva
  // se retransmite a TODOS los pedidos "en camino" del repartidor, no solo a uno.
  // Así, si va llevando varios pedidos de distintos clientes en la misma ruta,
  // todos ven su ubicación en simultáneo con un solo botón.
  useEffect(() => {
    if (!isSharing || !driver) return;
    if (!("geolocation" in navigator)) {
      setGeoError("Tu navegador no soporta geolocalización.");
      setIsSharing(false);
      return;
    }

    setGeoError(null);
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const activeOrders = mineRef.current.filter((o) => o.status === "ON_THE_WAY");
        for (const order of activeOrders) {
          sendDriverLocation({
            orderId: order.id,
            driverId: driver.id,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        }
      },
      () => setGeoError("No se pudo obtener tu ubicación. Revisa los permisos de ubicación del navegador."),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
    watchIdRef.current = id;

    return () => {
      navigator.geolocation.clearWatch(id);
      watchIdRef.current = null;
    };
  }, [isSharing, driver]);

  async function refresh() {
    const [av, mn] = await Promise.all([
      api.get<ApiDriverOrder[]>("/driver/orders/available"),
      api.get<ApiDriverOrder[]>("/driver/orders"),
    ]);
    setAvailable(av);
    setMine(mn);
  }

  async function acceptOrder(id: string) {
    await api.post(`/driver/orders/${id}/accept`);
    await refresh();
    setTab("mis-entregas");
  }

  async function updateStatus(id: string, status: "ON_THE_WAY" | "DELIVERED") {
    if (status === "DELIVERED" && !confirm("¿Confirmas que ya entregaste este pedido? Esta acción no se puede deshacer.")) {
      return;
    }
    await api.patch(`/driver/orders/${id}/status`, { status });
    await refresh();
  }

  if (authLoading || loading) {
    return <main className="min-h-screen px-6 py-16 text-center text-foreground/60">Cargando...</main>;
  }

  if (!driver) return null;

  const activeCount = mine.filter((o) => o.status === "ON_THE_WAY").length;

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold text-foreground">Panel de repartidor</h1>
      <p className="mt-1 text-sm text-foreground/60">
        {driver.vehicleType} · {driver.vehiclePlate} · {driver.phone}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-black/10 bg-white p-4">
        <button
          onClick={() => setIsSharing((v) => !v)}
          disabled={activeCount === 0}
          className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 ${
            isSharing ? "bg-red-600" : "bg-primary"
          }`}
        >
          {isSharing ? "Dejar de compartir ubicación" : "Compartir mi ubicación"}
        </button>
        <p className="text-sm text-foreground/60">
          {activeCount === 0
            ? "No tienes pedidos en camino ahora mismo."
            : isSharing
              ? `Transmitiendo en vivo a ${activeCount} pedido(s) en camino.`
              : `Tienes ${activeCount} pedido(s) en camino esperando tu ubicación.`}
        </p>
        {geoError && <p className="w-full text-xs text-red-600">{geoError}</p>}
      </div>

      <div className="mt-6 flex gap-4 border-b border-black/10">
        <button
          onClick={() => setTab("disponibles")}
          className={`pb-2 text-sm font-semibold ${tab === "disponibles" ? "border-b-2 border-primary text-primary" : "text-foreground/50"}`}
        >
          Disponibles ({available.length})
        </button>
        <button
          onClick={() => setTab("mis-entregas")}
          className={`pb-2 text-sm font-semibold ${tab === "mis-entregas" ? "border-b-2 border-primary text-primary" : "text-foreground/50"}`}
        >
          Mis entregas ({mine.length})
        </button>
      </div>

      {tab === "disponibles" ? (
        <ul className="mt-6 flex flex-col gap-3">
          {available.map((order) => (
            <li key={order.id} className="rounded-xl border border-black/10 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {order.vendor.storeName} → {order.buyer.name}
                  </p>
                  <p className="text-sm text-foreground/60">
                    {order.items.length} producto(s) · S/ {Number(order.total).toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() => acceptOrder(order.id)}
                  className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white"
                >
                  Aceptar
                </button>
              </div>
            </li>
          ))}
          {available.length === 0 && (
            <p className="text-sm text-foreground/60">No hay pedidos disponibles por el momento.</p>
          )}
        </ul>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {mine.map((order) => (
            <li key={order.id} className="rounded-xl border border-black/10 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {order.vendor.storeName} → {order.buyer.name}
                  </p>
                  <p className="text-sm text-foreground/60">
                    {STATUS_LABEL[order.status]} · S/ {Number(order.total).toFixed(2)}
                  </p>
                  {isSharing && order.status === "ON_THE_WAY" && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                      Compartiendo ubicación en vivo
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-3">
                  {order.status === "PREPARING" && (
                    <button
                      onClick={() => updateStatus(order.id, "ON_THE_WAY")}
                      className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white"
                    >
                      En camino
                    </button>
                  )}
                  {order.status === "ON_THE_WAY" && (
                    <button
                      onClick={() => updateStatus(order.id, "DELIVERED")}
                      className="rounded-lg border border-accent px-3 py-2 text-sm font-semibold text-accent"
                    >
                      Marcar como entregado
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
          {mine.length === 0 && <p className="text-sm text-foreground/60">Todavía no tienes entregas.</p>}
        </ul>
      )}
    </main>
  );
}
