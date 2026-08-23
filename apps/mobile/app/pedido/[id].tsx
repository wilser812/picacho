import { useEffect, useState } from "react";
import { FlatList, Linking, Pressable, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { api, formatPrice, type ApiDriverLocation, type ApiOrder } from "../../lib/api";
import { getSocket, joinOrderRoom } from "../../lib/socket";

const STATUS_LABEL: Record<ApiOrder["status"], string> = {
  RECEIVED: "Recibido",
  PREPARING: "En preparación",
  ON_THE_WAY: "En camino",
  DELIVERED: "Entregado",
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
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
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-foreground/60">Cargando...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-foreground/60">No se encontró el pedido.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground">Pedido de {order.vendor.storeName}</Text>

      <View className="mt-3 flex-row flex-wrap gap-2">
        <Text className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
          {STATUS_LABEL[order.status]}
        </Text>
        {order.payment && (
          <Text className="rounded-full bg-accent/10 px-3 py-1 text-sm font-semibold text-accent">
            Pago: {order.payment.status === "approved" ? "aprobado" : order.payment.status}
          </Text>
        )}
      </View>

      {order.driver && (
        <View className="mt-4 rounded-xl border border-black/10 bg-white p-4">
          <Text className="font-medium text-foreground">Repartidor: {order.driver.user.name}</Text>
          <Text className="mt-1 text-sm text-foreground/60">
            {order.driver.vehicleType} · {order.driver.vehiclePlate}
          </Text>
          <View className="mt-3 flex-row gap-3">
            <Pressable
              onPress={() => Linking.openURL(`tel:${order.driver!.phone}`)}
              className="flex-1 items-center rounded-lg bg-primary px-3 py-2"
            >
              <Text className="text-sm font-semibold text-white">Llamar</Text>
            </Pressable>
            {location && (
              <Pressable
                onPress={() =>
                  Linking.openURL(`https://www.google.com/maps?q=${location.lat},${location.lng}`)
                }
                className="flex-1 items-center rounded-lg bg-accent px-3 py-2"
              >
                <Text className="text-sm font-semibold text-white">Ver en Mapa</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      <FlatList
        className="mt-4"
        data={order.items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ gap: 12 }}
        renderItem={({ item }) => (
          <View className="flex-row items-center justify-between rounded-xl border border-black/10 bg-white p-4">
            <View>
              <Text className="font-medium text-foreground">{item.product.name}</Text>
              <Text className="text-sm text-foreground/60">
                {item.quantity} {item.product.unit === "KG" ? "kg" : item.product.unit === "LITER" ? "L" : "unidad(es)"}
              </Text>
            </View>
            <Text className="font-semibold text-foreground">
              {formatPrice(item.unitPrice, item.product.unit)}
            </Text>
          </View>
        )}
      />

      <View className="mt-4 flex-row items-center justify-between border-t border-black/10 pt-4">
        <Text className="text-lg font-semibold text-foreground">Total</Text>
        <Text className="text-lg font-bold text-primary">S/ {Number(order.total).toFixed(2)}</Text>
      </View>
    </View>
  );
}
