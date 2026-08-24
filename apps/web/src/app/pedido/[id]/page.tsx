"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, formatPrice, type ApiDriverLocation, type ApiOrder } from "@/lib/api";
import { getSocket, joinOrderRoom } from "@/lib/socket";

const STATUS_LABEL: Record<ApiOrder["status"], string> = {
  RECEIVED: "Recibido",
  PREPARING: "En preparación",
  ON_THE_WAY: "En camino",
  DELIVERED: "Entregado",
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [location, setLocation] = useState<ApiDriverLocation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<ApiOrder>(`/orders/${id}`)
      .then(setOrder)
      .finally(() => setLoading(false));

    api
      .get<ApiDriverLocation | null>(`/orders/${id}/driver-location`)
      .then((loc) => loc && setLocation(loc))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!order?.driver) return;

    joinOrderRoom(id);
    const socket = getSocket();
    const handler = (payload: { orderId: string; lat: number; lng: number }) => {
      if (payload.orderId === id) {
        setLocation({ lat: payload.lat, lng: payload.lng, updatedAt: new Date().toISOString() });
      }
    };
    socket.on("driver:location", handler);
    return () => {
      socket.off("driver:location", handler);
    };
  }, [id, order?.driver]);

  if (loading) {
    return (
      <main className="min-h-screen px-6 py-16 text-center text-foreground/60">Cargando...</main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen px-6 py-16 text-center text-foreground/60">
        No se encontró el pedido.
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-bold text-foreground">Pedido de {order.vendor.storeName}</h1>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
          {STATUS_LABEL[order.status]}
        </span>
        {order.payment && (
          <span
            className={`rounded-full px-3 py-1 text-sm font-semibold ${
              order.payment.status === "approved"
                ? "bg-primary/10 text-primary"
                : "bg-accent/10 text-accent"
            }`}
          >
            Pago: {order.payment.status === "approved" ? "aprobado" : order.payment.status}
          </span>
        )}
        {order.invoice?.pdfUrl && (
          <a
            href={order.invoice.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-foreground/10 px-3 py-1 text-sm font-semibold text-foreground hover:bg-foreground/20"
          >
            Ver {order.invoice.docType === "FACTURA" ? "factura" : "boleta"} {order.invoice.series}-
            {String(order.invoice.correlative).padStart(6, "0")}
          </a>
        )}
      </div>

      {order.driver && (
        <div className="mt-4 rounded-xl border border-black/10 bg-white p-4">
          <p className="font-medium">Repartidor: {order.driver.user.name}</p>
          <p className="mt-1 text-sm text-foreground/60">
            {order.driver.vehicleType} · {order.driver.vehiclePlate}
          </p>
          <div className="mt-3 flex gap-3">
            <a
              href={`tel:${order.driver.phone}`}
              className="flex-1 rounded-lg bg-primary px-3 py-2 text-center text-sm font-semibold text-white"
            >
              Llamar
            </a>
            {location && (
              <a
                href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-lg bg-accent px-3 py-2 text-center text-sm font-semibold text-white"
              >
                Ver en Mapa
              </a>
            )}
          </div>
        </div>
      )}

      <ul className="mt-6 flex flex-col gap-3">
        {order.items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between rounded-xl border border-black/10 bg-white p-4"
          >
            <div>
              <p className="font-medium">{item.product.name}</p>
              <p className="text-sm text-foreground/60">
                {item.quantity} {item.product.unit === "KG" ? "kg" : item.product.unit === "LITER" ? "L" : "unidad(es)"}
              </p>
            </div>
            <span className="font-semibold">{formatPrice(item.unitPrice, item.product.unit)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between border-t border-black/10 pt-4">
        <span className="text-lg font-semibold">Total</span>
        <span className="text-lg font-bold text-primary">S/ {Number(order.total).toFixed(2)}</span>
      </div>
    </main>
  );
}
