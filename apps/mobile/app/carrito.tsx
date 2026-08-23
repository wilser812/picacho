import { useState } from "react";
import { FlatList, Linking, Pressable, Text, TextInput, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { api, type ApiOrder } from "../lib/api";

export default function CartScreen() {
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
      await Linking.openURL(checkouts[0].checkoutUrl);
      router.push("/pedidos");
    } catch {
      setError("No se pudo procesar el pedido. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-foreground/70">Tu carrito está vacío.</Text>
        <Link href="/" className="mt-4 font-semibold text-accent">
          Ir al catálogo
        </Link>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground">Tu carrito</Text>

      <FlatList
        className="mt-4"
        data={items}
        keyExtractor={(i) => i.productId}
        contentContainerStyle={{ gap: 12 }}
        renderItem={({ item }) => (
          <View className="flex-row items-center justify-between rounded-xl border border-black/10 bg-white p-4">
            <View>
              <Text className="font-medium text-foreground">{item.name}</Text>
              <Text className="text-sm text-foreground/60">S/ {Number(item.price).toFixed(2)}</Text>
            </View>
            <View className="flex-row items-center gap-3">
              <TextInput
                value={String(item.quantity)}
                onChangeText={(v) => setQuantity(item.productId, Number(v) || 0)}
                keyboardType="numeric"
                className="w-14 rounded-lg border border-black/10 bg-white px-2 py-1 text-center text-foreground"
              />
              <Pressable onPress={() => removeItem(item.productId)}>
                <Text className="text-sm text-foreground/50">Quitar</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      <View className="mt-4 flex-row items-center justify-between border-t border-black/10 pt-4">
        <Text className="text-lg font-semibold text-foreground">Total</Text>
        <Text className="text-lg font-bold text-primary">S/ {total.toFixed(2)}</Text>
      </View>

      {error && <Text className="mt-2 text-sm text-red-600">{error}</Text>}

      <Pressable
        onPress={checkout}
        disabled={loading}
        className="mt-4 items-center rounded-lg bg-accent px-4 py-3"
      >
        <Text className="font-semibold text-white">
          {loading ? "Procesando..." : "Proceder al pago"}
        </Text>
      </Pressable>
    </View>
  );
}
