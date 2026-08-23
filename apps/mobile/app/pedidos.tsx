import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { api, type ApiOrder } from "../lib/api";

const STATUS_LABEL: Record<ApiOrder["status"], string> = {
  RECEIVED: "Recibido",
  PREPARING: "En preparación",
  ON_THE_WAY: "En camino",
  DELIVERED: "Entregado",
};

export default function OrdersScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    api
      .get<ApiOrder[]>("/orders")
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-foreground/60">Cargando...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground">Mis pedidos</Text>

      {orders.length === 0 ? (
        <Text className="mt-4 text-foreground/60">Todavía no tienes pedidos.</Text>
      ) : (
        <FlatList
          className="mt-4"
          data={orders}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ gap: 12 }}
          renderItem={({ item: order }) => (
            <Link href={{ pathname: "/pedido/[id]", params: { id: order.id } }} asChild>
              <Pressable className="flex-row items-center justify-between rounded-xl border border-black/10 bg-white p-4">
                <View>
                  <Text className="font-medium text-foreground">{order.vendor.storeName}</Text>
                  <Text className="text-sm text-foreground/60">
                    {STATUS_LABEL[order.status]} · {order.items.length} producto(s)
                  </Text>
                </View>
                <Text className="font-semibold text-primary">
                  S/ {Number(order.total).toFixed(2)}
                </Text>
              </Pressable>
            </Link>
          )}
        />
      )}
    </View>
  );
}
