import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { useAuth } from "../context/AuthContext";
import { api, type ApiDriverOrder, type ApiDriverProfile } from "../lib/api";
import { sendDriverLocation } from "../lib/socket";

const STATUS_LABEL: Record<ApiDriverOrder["status"], string> = {
  RECEIVED: "Recibido",
  PREPARING: "En preparación",
  ON_THE_WAY: "En camino",
  DELIVERED: "Entregado",
};

export default function DriverHome() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [driver, setDriver] = useState<ApiDriverProfile | null>(null);
  const [tab, setTab] = useState<"disponibles" | "mios">("disponibles");
  const [available, setAvailable] = useState<ApiDriverOrder[]>([]);
  const [mine, setMine] = useState<ApiDriverOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "DRIVER") {
      router.replace("/registro-vehiculo");
      return;
    }
    refreshAll();
  }, [user, authLoading]);

  async function refreshAll() {
    const [profile, avail, own] = await Promise.all([
      api.get<ApiDriverProfile>("/driver/me"),
      api.get<ApiDriverOrder[]>("/driver/orders/available"),
      api.get<ApiDriverOrder[]>("/driver/orders"),
    ]);
    setDriver(profile);
    setAvailable(avail);
    setMine(own);
    setLoading(false);
  }

  // Comparte la ubicación en vivo mientras haya un pedido "En camino" asignado.
  // MVP: solo mientras la app está en primer plano (foreground). Compartir en
  // segundo plano requeriría un TaskManager de Expo, pendiente para una fase futura.
  useEffect(() => {
    const activeOrder = mine.find((o) => o.status === "ON_THE_WAY");
    if (!driver || !activeOrder) return;

    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 4000, distanceInterval: 10 },
        (loc) => {
          sendDriverLocation(activeOrder.id, driver.id, loc.coords.latitude, loc.coords.longitude);
        },
      );
    })();

    return () => {
      subscription?.remove();
    };
  }, [driver, mine]);

  async function acceptOrder(id: string) {
    await api.post(`/driver/orders/${id}/accept`);
    await refreshAll();
    setTab("mios");
  }

  async function advanceStatus(order: ApiDriverOrder) {
    const next = order.status === "PREPARING" ? "ON_THE_WAY" : "DELIVERED";
    await api.patch(`/driver/orders/${order.id}/status`, { status: next });
    await refreshAll();
  }

  if (authLoading || loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-foreground/60">Cargando...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background px-4 pt-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-primary">Picacho Repartidor</Text>
        <Pressable onPress={logout}>
          <Text className="text-sm text-foreground/50">Salir</Text>
        </Pressable>
      </View>
      {driver && (
        <Text className="mt-1 text-sm text-foreground/60">
          {driver.vehicleType} · {driver.vehiclePlate}
        </Text>
      )}

      <View className="mt-4 flex-row gap-4 border-b border-black/10">
        <Pressable onPress={() => setTab("disponibles")}>
          <Text
            className={`pb-2 text-sm font-semibold ${tab === "disponibles" ? "border-b-2 border-primary text-primary" : "text-foreground/50"}`}
          >
            Disponibles ({available.length})
          </Text>
        </Pressable>
        <Pressable onPress={() => setTab("mios")}>
          <Text
            className={`pb-2 text-sm font-semibold ${tab === "mios" ? "border-b-2 border-primary text-primary" : "text-foreground/50"}`}
          >
            Mis pedidos ({mine.length})
          </Text>
        </Pressable>
      </View>

      {tab === "disponibles" ? (
        <FlatList
          className="mt-4"
          data={available}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
          ListEmptyComponent={<Text className="text-foreground/60">No hay pedidos disponibles.</Text>}
          renderItem={({ item }) => (
            <View className="rounded-xl border border-black/10 bg-white p-4">
              <Text className="font-medium text-foreground">{item.vendor.storeName}</Text>
              <Text className="text-sm text-foreground/60">
                {item.items.length} producto(s) · S/ {Number(item.total).toFixed(2)}
              </Text>
              <Pressable
                onPress={() => acceptOrder(item.id)}
                className="mt-3 items-center rounded-lg bg-accent px-3 py-2"
              >
                <Text className="text-sm font-semibold text-white">Aceptar pedido</Text>
              </Pressable>
            </View>
          )}
        />
      ) : (
        <FlatList
          className="mt-4"
          data={mine}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
          ListEmptyComponent={<Text className="text-foreground/60">No tienes pedidos asignados.</Text>}
          renderItem={({ item }) => (
            <View className="rounded-xl border border-black/10 bg-white p-4">
              <Text className="font-medium text-foreground">
                {item.vendor.storeName} → {item.buyer.name}
              </Text>
              <Text className="text-sm text-foreground/60">{STATUS_LABEL[item.status]}</Text>
              {(item.status === "PREPARING" || item.status === "ON_THE_WAY") && (
                <Pressable
                  onPress={() => advanceStatus(item)}
                  className="mt-3 items-center rounded-lg bg-primary px-3 py-2"
                >
                  <Text className="text-sm font-semibold text-white">
                    {item.status === "PREPARING" ? "Recogido, en camino" : "Marcar entregado"}
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}
