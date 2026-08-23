import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { picachoCategoryTree } from "@picacho/shared";
import { api, type ApiProduct } from "../lib/api";
import { fetchWithCache } from "../lib/offlineCache";
import { SearchBar } from "../components/SearchBar";
import { ProductGrid } from "../components/ProductGrid";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const { count } = useCart();
  const [essentials, setEssentials] = useState<ApiProduct[]>([]);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    fetchWithCache("essentials", () => api.get<ApiProduct[]>("/products?essential=true"))
      .then(({ data, fromCache }) => {
        setEssentials(data);
        setOffline(fromCache);
      })
      .catch(() => setEssentials([]));
  }, []);

  return (
    <ScrollView className="flex-1 bg-background px-4 pt-4">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-bold text-primary">Picacho</Text>
          <Text className="mt-1 text-foreground/80">
            Cercanía, frescura y compras rápidas de confianza.
          </Text>
        </View>
        <View className="items-end gap-1">
          <Link href="/carrito" className="text-sm font-medium text-foreground">
            Carrito{count > 0 ? ` (${count})` : ""}
          </Link>
          {user ? (
            <Link href="/pedidos" className="text-sm font-medium text-foreground">
              Mis pedidos
            </Link>
          ) : (
            <Link href="/login" className="text-sm font-semibold text-accent">
              Iniciar sesión
            </Link>
          )}
        </View>
      </View>

      <View className="mt-4">
        <SearchBar />
      </View>

      <View className="mt-6 flex-row flex-wrap gap-3">
        {picachoCategoryTree.map((item) => (
          <Pressable
            key={item.slug}
            onPress={() =>
              router.push({ pathname: "/categoria/[slug]", params: { slug: item.slug } })
            }
            className="w-[47%] rounded-xl border border-black/10 bg-white p-4"
          >
            <Text className="text-2xl">{item.icon}</Text>
            <Text className="mt-1 font-medium text-foreground">{item.name}</Text>
          </Pressable>
        ))}
      </View>

      <View className="mt-8">
        <Text className="text-lg font-semibold text-foreground">Productos Esenciales</Text>
        <Text className="text-xs text-foreground/60">Ordenados de menor a mayor precio.</Text>
        {offline && (
          <Text className="mt-2 rounded-lg bg-accent/10 px-3 py-2 text-xs text-accent">
            Sin conexión: mostrando el catálogo guardado en tu última visita.
          </Text>
        )}
        <ProductGrid products={essentials} scrollEnabled={false} />
      </View>
    </ScrollView>
  );
}
